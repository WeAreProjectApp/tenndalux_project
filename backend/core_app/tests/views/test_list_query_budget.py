"""Regression coverage for the bounded-cost catalogue and lead list endpoints."""

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from django_attachments.models import Attachment, Library
from rest_framework import status

from core_app.models import (
    Category,
    ContentImage,
    HomePage,
    Lead,
    LeadStatus,
    Post,
    Project,
    Space,
    Style,
    Tag,
)
from core_app.serializers import HomePageSerializer, PostSerializer, ProjectSerializer


def _gallery_block(*image_ids):
    return [{'type': 'galeria', 'images': list(image_ids)}]


def _content_image(prefix, index, alt):
    return ContentImage.objects.create(
        public_id=f'img_{prefix}_{index}',
        image=f'isolated/{prefix}-{index}.jpg',
        alt=alt,
    )


def _library(prefix, index):
    library = Library.objects.create(title=f'{prefix} library {index}')
    now = timezone.now()
    attachment = Attachment(
        library=library,
        rank=0,
        original_name=f'{prefix}-{index}.jpg',
        file=f'isolated/{prefix}-{index}.jpg',
        filesize=1,
        created=now,
        updated=now,
    )
    Attachment.objects.bulk_create([attachment])
    library.primary_attachment = attachment
    library.save(update_fields=['primary_attachment'])
    return library


def _project(index):
    category = Category.objects.create(name=f'Project category {index}')
    style = Style.objects.create(name=f'Project style {index}')
    space = Space.objects.create(name=f'Project space {index}')
    image = _content_image('project', index, f'Project image {index}')
    project = Project.objects.create(
        title=f'Project {index}',
        gallery=_library('project', index),
        content_blocks=_gallery_block(image.public_id, 'img_missing_project', image.public_id),
        is_published=True,
    )
    project.categories.add(category)
    project.styles.add(style)
    project.spaces.add(space)
    return project


def _projects_after_first():
    for index in range(2, 21):
        _project(index)


def _post(index):
    tag = Tag.objects.create(name=f'Post tag {index}')
    image = _content_image('post', index, f'Post image {index}')
    post = Post.objects.create(
        title=f'Post {index}',
        cover_image=_library('post', index),
        content_blocks=_gallery_block(image.public_id, 'img_missing_post', image.public_id),
        is_published=True,
    )
    post.tags.add(tag)
    return post


def _posts_after_first():
    for index in range(2, 21):
        _post(index)


def _lead(index):
    category = Category.objects.create(name=f'Lead category {index}')
    space = Space.objects.create(name=f'Lead space {index}')
    lead_status = LeadStatus.objects.create(name=f'Lead status {index}')
    lead = Lead.objects.create(
        full_name=f'Lead {index}',
        email=f'lead-{index}@example.test',
        project_type=category,
        status=lead_status,
    )
    lead.space_types.add(space)
    return lead


def _leads_after_first():
    for index in range(2, 21):
        _lead(index)


def _list_response(client, route_name):
    with CaptureQueriesContext(connection) as captured:
        response = client.get(reverse(route_name))

    assert response.status_code == status.HTTP_200_OK
    return len(captured), response.data['results']


def _content_image_query_count(captured):
    return sum('core_app_contentimage' in query['sql'].lower() for query in captured.captured_queries)


def _missing_project_serializer():
    missing = Project.objects.create(title='Missing project', content_blocks=_gallery_block('img_missing'))
    empty = Project.objects.create(title='Empty project', content_blocks=_gallery_block())
    return ProjectSerializer([missing, empty], many=True)


def _missing_post_serializer():
    missing = Post.objects.create(title='Missing post', content_blocks=_gallery_block('img_missing'))
    empty = Post.objects.create(title='Empty post', content_blocks=_gallery_block())
    return PostSerializer([missing, empty], many=True)


def _project_serializer_to_refresh():
    image = _content_image('refresh-project', 1, 'Original project alt')
    project = Project.objects.create(title='Refresh project', content_blocks=_gallery_block(image.public_id))
    return ProjectSerializer([project], many=True), project, image


def _post_serializer_to_refresh():
    image = _content_image('refresh-post', 1, 'Original post alt')
    post = Post.objects.create(title='Refresh post', content_blocks=_gallery_block(image.public_id))
    return PostSerializer([post], many=True), post, image


def _project_with_empty_gallery():
    return Project.objects.create(
        title='Project without cover attachment',
        gallery=Library.objects.create(title='Project empty gallery'),
        is_published=True,
    )


def _post_with_empty_cover():
    return Post.objects.create(
        title='Post without cover attachment',
        cover_image=Library.objects.create(title='Post empty gallery'),
        is_published=True,
    )


@pytest.mark.django_db
def test_project_list_query_cost_stays_constant_with_gallery_output(api_client):
    """Falla si cada proyecto vuelve a cargar sus relaciones o imágenes por separado."""
    first_project = _project(1)
    one_query_count, one_results = _list_response(api_client, 'project-list')
    _projects_after_first()
    twenty_query_count, twenty_results = _list_response(api_client, 'project-list')

    assert one_query_count == twenty_query_count
    assert one_query_count <= 6
    assert one_results[0]['id'] == first_project.pk
    assert [image['id'] for image in one_results[0]['content_blocks'][0]['images']] == [
        'img_project_1',
        'img_project_1',
    ]
    assert [image['alt'] for image in one_results[0]['content_blocks'][0]['images']] == [
        'Project image 1',
        'Project image 1',
    ]
    assert (
        [category['name'] for category in twenty_results[0]['categories']],
        [style['name'] for style in twenty_results[0]['styles']],
        [space['name'] for space in twenty_results[0]['spaces']],
        twenty_results[0]['cover_image_url'].endswith('project-20.jpg'),
    ) == (['Project category 20'], ['Project style 20'], ['Project space 20'], True)


@pytest.mark.django_db
def test_post_list_query_cost_stays_constant_with_gallery_output(api_client):
    """Falla si cada post vuelve a cargar sus etiquetas, portada o imágenes por separado."""
    first_post = _post(1)
    one_query_count, one_results = _list_response(api_client, 'post-list')
    _posts_after_first()
    twenty_query_count, twenty_results = _list_response(api_client, 'post-list')

    assert one_query_count == twenty_query_count
    assert one_query_count <= 6
    assert one_results[0]['id'] == first_post.pk
    assert [image['id'] for image in one_results[0]['content_blocks'][0]['images']] == [
        'img_post_1',
        'img_post_1',
    ]
    assert [image['alt'] for image in one_results[0]['content_blocks'][0]['images']] == [
        'Post image 1',
        'Post image 1',
    ]
    assert (
        [tag['name'] for tag in twenty_results[0]['tags']],
        twenty_results[0]['cover_image_url'].endswith('post-20.jpg'),
    ) == (['Post tag 20'], True)


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('creator', 'route_name'),
    [
        (_project_with_empty_gallery, 'project-list'),
        (_post_with_empty_cover, 'post-list'),
    ],
)
def test_catalogue_list_returns_null_cover_for_an_empty_library(api_client, creator, route_name):
    """Falla si una biblioteca sin adjunto produce una portada rota en el catálogo."""
    creator()
    _, results = _list_response(api_client, route_name)

    assert results[0]['cover_image_url'] is None


@pytest.mark.django_db
def test_lead_list_query_cost_stays_constant_with_relation_output(api_client, existing_user):
    """Falla si la lista de contactos vuelve a consultar cada relación por fila."""
    existing_user.role = 'admin'
    existing_user.save(update_fields=['role'])
    api_client.force_authenticate(user=existing_user)
    first_lead = _lead(1)
    one_query_count, one_results = _list_response(api_client, 'lead-list')
    _leads_after_first()
    twenty_query_count, _ = _list_response(api_client, 'lead-list')
    detail = api_client.get(reverse('lead-detail', args=[first_lead.pk]))

    assert one_query_count == twenty_query_count
    assert one_query_count <= 6
    assert detail.status_code == status.HTTP_200_OK
    assert one_results[0]['project_type'] == detail.data['project_type']
    assert one_results[0]['status'] == detail.data['status']
    assert one_results[0]['space_types'] == detail.data['space_types']


@pytest.mark.django_db
def test_project_gallery_images_do_not_leak_between_serialization_pages():
    """Falla si una página de proyectos deja sus imágenes disponibles para la siguiente."""
    project_image = _content_image('isolation-project', 1, 'Project image')
    other_image = _content_image('isolation-other', 1, 'Other image')
    first_project = Project.objects.create(title='First project', content_blocks=_gallery_block(project_image.public_id))
    second_project = Project.objects.create(title='Second project', content_blocks=_gallery_block(other_image.public_id))

    first_page = ProjectSerializer([first_project], many=True).data
    second_page = ProjectSerializer([second_project], many=True).data
    individual = ProjectSerializer(second_project).data

    assert first_page[0]['content_blocks'][0]['images'][0]['id'] == project_image.public_id
    assert second_page[0]['content_blocks'][0]['images'][0]['id'] == other_image.public_id
    assert individual['content_blocks'][0]['images'][0]['id'] == other_image.public_id


@pytest.mark.django_db
def test_post_gallery_images_do_not_leak_from_project_serialization():
    """Falla si serializar una página de proyectos altera la galería individual de un post."""
    project_image = _content_image('isolation-project-post', 1, 'Project image')
    post_image = _content_image('isolation-post', 1, 'Post image')
    project = Project.objects.create(title='Source project', content_blocks=_gallery_block(project_image.public_id))
    post = Post.objects.create(title='Target post', content_blocks=_gallery_block(post_image.public_id))

    ProjectSerializer([project], many=True).data
    post_data = PostSerializer(post).data

    assert post_data['content_blocks'][0]['images'] == [{
        'id': post_image.public_id,
        'url': post_image.image.url,
        'alt': 'Post image',
    }]


@pytest.mark.django_db
@pytest.mark.parametrize('serializer_factory', [_missing_project_serializer, _missing_post_serializer])
def test_many_serializers_return_empty_images_for_missing_gallery_ids(serializer_factory):
    """Falla si imágenes faltantes o galerías vacías llegan como referencias rotas al frontend."""
    serializer = serializer_factory()
    with CaptureQueriesContext(connection) as captured:
        data = serializer.data

    assert data[0]['content_blocks'][0]['images'] == []
    assert data[1]['content_blocks'][0]['images'] == []
    assert _content_image_query_count(captured) <= 1


@pytest.mark.django_db
@pytest.mark.parametrize('serializer_factory', [_project_serializer_to_refresh, _post_serializer_to_refresh])
def test_reused_many_serializers_refresh_gallery_alt_text(serializer_factory):
    """Falla si reutilizar un serializador entrega el mapa de imágenes de una página anterior."""
    serializer, instance, image = serializer_factory()
    first_page = serializer.data
    ContentImage.objects.filter(pk=image.pk).update(alt='Updated alt')
    with CaptureQueriesContext(connection) as captured:
        refreshed_page = serializer.to_representation([instance])

    assert first_page[0]['content_blocks'][0]['images'][0]['alt'].startswith('Original')
    assert refreshed_page[0]['content_blocks'][0]['images'][0]['alt'] == 'Updated alt'
    assert _content_image_query_count(captured) == 1


@pytest.mark.django_db
def test_home_page_featured_project_resolves_its_gallery_image():
    """Falla si los proyectos destacados saltan la resolución de galerías al serializar la portada."""
    image = _content_image('featured-project', 1, 'Featured project image')
    project = Project.objects.create(title='Featured project', content_blocks=_gallery_block(image.public_id))
    home_page = HomePage.load()
    home_page.featured_projects.add(project)

    featured = HomePageSerializer(home_page).data['featured_projects']

    assert featured[0]['content_blocks'][0]['images'] == [{
        'id': image.public_id,
        'url': image.image.url,
        'alt': 'Featured project image',
    }]
