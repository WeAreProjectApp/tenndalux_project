"""The actual Home GET must not add queries for every featured project."""

import logging

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from django_attachments.models import Attachment, Library

from core_app.models import (
    Category,
    ContentImage,
    HomePage,
    Project,
    Space,
    Style,
    User,
)


def _project(index, published=True):
    library = Library.objects.create(title=f'Featured library {index}')
    attachment = Attachment(
        library=library, rank=0, original_name=f'{index}.png',
        file=f'isolated/{index}.png', filesize=1,
        created=timezone.now(), updated=timezone.now(),
    )
    # File URL serialization does not need to write media to disk.
    Attachment.objects.bulk_create([attachment])
    library.primary_attachment = attachment
    library.save(update_fields=['primary_attachment'])
    image = ContentImage.objects.create(
        public_id=f'img_featured_{index}', image=f'isolated/block-{index}.png', alt=f'Image {index}',
    )
    project = Project.objects.create(
        title=f'Featured {index}', is_published=published, gallery=library,
        content_blocks=[{'type': 'galeria', 'images': [image.public_id]}],
    )
    project.categories.add(Category.objects.create(name=f'Category {index}'))
    project.styles.add(Style.objects.create(name=f'Style {index}'))
    project.spaces.add(Space.objects.create(name=f'Space {index}'))
    return project


def _extend(home):
    home.featured_projects.add(*[_project(index) for index in range(2, 21)])


def _get(client):
    with CaptureQueriesContext(connection) as queries:
        response = client.get(reverse('home-page'))
    assert response.status_code == 200
    return len(queries), response.data['featured_projects']


@pytest.fixture(params=[None, User.ROLE_VIEWER, User.ROLE_ADMIN])
def role_client(request, api_client, db):
    """Exercise public reads and both authorized reader roles."""
    role = request.param
    if role is not None:
        api_client.force_authenticate(User.objects.create_user(
            email=f'{role}@example.test', password='fixture-only-password', role=role,
        ))
    return role, api_client


@pytest.mark.django_db
def test_home_get_query_count_is_constant(role_client):
    """A larger featured selection must cost the same number of SQL queries."""
    role, api_client = role_client
    home = HomePage.load()
    first = _project(1)
    home.featured_projects.add(first)
    count_one, one = _get(api_client)
    _extend(home)

    count_twenty, twenty = _get(api_client)

    logging.getLogger(__name__).info('HOME_SQL role=%s Q(1)=%s Q(20)=%s', role, count_one, count_twenty)
    assert len(one) == 1
    assert len(twenty) == 20
    assert count_twenty == count_one


@pytest.mark.django_db
def test_home_get_preserves_featured_project_data(api_client):
    """Eager loading must keep nested content and the existing project order."""
    home = HomePage.load()
    home.featured_projects.add(_project(1), _project(2))

    _, projects = _get(api_client)

    assert [item['id'] for item in projects] == list(
        home.featured_projects.order_by('-created_at').values_list('id', flat=True)
    )
    assert projects[-1]['cover_image_url'].endswith('/isolated/1.png')
    assert projects[-1]['categories'][0]['name'] == 'Category 1'
    assert projects[-1]['styles'][0]['name'] == 'Style 1'
    assert projects[-1]['spaces'][0]['name'] == 'Space 1'
    assert projects[-1]['content_blocks'][0]['images'][0]['alt'] == 'Image 1'


@pytest.mark.django_db
def test_home_public_get_keeps_draft_selection_hidden(api_client):
    """Public filtering must not remove the administrator's saved selection."""
    home = HomePage.load()
    draft = _project(1, published=False)
    home.featured_projects.add(draft)

    _, projects = _get(api_client)

    assert projects == []
    assert list(home.featured_projects.values_list('id', flat=True)) == [draft.id]


@pytest.mark.django_db
def test_home_viewer_get_can_read_selected_drafts(api_client):
    """The viewer role retains the established permission to read drafts."""
    home = HomePage.load()
    draft = _project(1, published=False)
    home.featured_projects.add(draft)
    api_client.force_authenticate(User.objects.create_user(
        email='viewer@example.test', password='fixture-only-password', role=User.ROLE_VIEWER,
    ))

    _, projects = _get(api_client)

    assert [item['id'] for item in projects] == [draft.id]
