"""HTTP authorization tests for singleton site configuration."""

import pytest
from django.urls import reverse
from rest_framework import status

from core_app.models import AboutPage, HomePage, Project, SiteSettings, User

SINGLETONS = (
    (
        "settings",
        "site-settings",
        SiteSettings,
        "company_name",
        "Before settings",
        "After settings",
    ),
    ("home", "home-page", HomePage, "hero_title", "Before home", "After home"),
    ("about", "about-page", AboutPage, "title", "Before about", "After about"),
)


def _role_user(role, is_staff=False):
    return User.objects.create_user(
        email=f"{role}-site-{is_staff}@example.com",
        password="safe-password",
        role=role,
        is_staff=is_staff,
    )


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("name", "route", "model", "field", "before", "after"),
    SINGLETONS,
    ids=[item[0] for item in SINGLETONS],
)
def test_singleton_get_remains_public(
    api_client, name, route, model, field, before, after
):
    """Fails if public site configuration can no longer be read without a JWT."""
    singleton = model.load()

    response = api_client.get(reverse(route))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == singleton.id


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("name", "route", "model", "field", "before", "after"),
    SINGLETONS,
    ids=[item[0] for item in SINGLETONS],
)
def test_singleton_patch_requires_jwt(
    api_client, name, route, model, field, before, after
):
    """Fails if an anonymous visitor can modify a singleton site page."""
    singleton = model.load()
    setattr(singleton, field, before)
    singleton.save()

    response = api_client.patch(reverse(route), {field: after}, format="json")

    singleton.refresh_from_db()
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert getattr(singleton, field) == before


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("role", "is_staff"),
    [(User.ROLE_VIEWER, False), (User.ROLE_EDITOR, False), (User.ROLE_VIEWER, True)],
    ids=("viewer", "editor", "staff-viewer"),
)
@pytest.mark.parametrize(
    ("name", "route", "model", "field", "before", "after"),
    SINGLETONS,
    ids=[item[0] for item in SINGLETONS],
)
def test_singleton_patch_rejects_non_admin(
    api_client, role, is_staff, name, route, model, field, before, after
):
    """Fails if a viewer, editor, or staff-only account can edit a singleton site page."""
    singleton = model.load()
    setattr(singleton, field, before)
    singleton.save()
    api_client.force_authenticate(user=_role_user(role, is_staff))

    response = api_client.patch(reverse(route), {field: after}, format="json")

    singleton.refresh_from_db()
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert getattr(singleton, field) == before


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("name", "route", "model", "field", "before", "after"),
    SINGLETONS,
    ids=[item[0] for item in SINGLETONS],
)
def test_singleton_patch_persists_for_admin(
    api_client, name, route, model, field, before, after
):
    """Fails if an administrator can no longer edit a singleton site page."""
    singleton = model.load()
    setattr(singleton, field, before)
    singleton.save()
    api_client.force_authenticate(user=_role_user(User.ROLE_ADMIN))

    response = api_client.patch(reverse(route), {field: after}, format="json")

    singleton.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert getattr(singleton, field) == after


def _featured_project(title, is_published):
    return Project.objects.create(
        title=title,
        description=f'{title} private description',
        is_published=is_published,
    )


@pytest.mark.django_db
def test_home_page_excludes_unpublished_featured_projects_for_anonymous_visitors(api_client):
    """Falla si la portada pública vuelve a exponer un proyecto destacado sin publicar."""
    published = _featured_project('Published project', True)
    draft = _featured_project('Draft project', False)
    home = HomePage.load()
    home.featured_projects.add(published, draft)

    response = api_client.get(reverse('home-page'))

    assert response.status_code == status.HTTP_200_OK
    assert [project['id'] for project in response.data['featured_projects']] == [published.pk]
    assert draft.description not in str(response.data)


@pytest.mark.django_db
def test_home_page_returns_no_featured_projects_when_only_drafts_are_selected(api_client):
    """Falla si una portada con solo borradores muestra contenido no publicado a visitantes."""
    home = HomePage.load()
    home.featured_projects.add(_featured_project('Draft-only project', False))

    response = api_client.get(reverse('home-page'))

    assert response.status_code == status.HTTP_200_OK
    assert response.data['featured_projects'] == []


@pytest.mark.django_db
@pytest.mark.parametrize(
    'role',
    [User.ROLE_VIEWER, User.ROLE_EDITOR, User.ROLE_ADMIN],
    ids=('viewer', 'editor', 'admin'),
)
def test_home_page_keeps_unpublished_featured_projects_visible_to_authenticated_roles(
    api_client, role
):
    """Falla si el filtro público también oculta borradores a un rol autenticado."""
    published = _featured_project('Published project', True)
    draft = _featured_project('Draft project', False)
    home = HomePage.load()
    home.featured_projects.add(published, draft)
    api_client.force_authenticate(user=_role_user(role))

    response = api_client.get(reverse('home-page'))

    assert response.status_code == status.HTTP_200_OK
    assert sorted(project['id'] for project in response.data['featured_projects']) == sorted(
        [published.pk, draft.pk]
    )


@pytest.mark.django_db
def test_home_page_does_not_reuse_authenticated_featured_projects_for_anonymous_request(
    api_client,
):
    """Falla si una solicitud autenticada deja borradores en caché para el visitante siguiente."""
    published = _featured_project('Published project', True)
    draft = _featured_project('Draft project', False)
    home = HomePage.load()
    home.featured_projects.add(published, draft)
    api_client.force_authenticate(user=_role_user(User.ROLE_ADMIN))

    authenticated_response = api_client.get(reverse('home-page'))
    api_client.force_authenticate(user=None)
    anonymous_response = api_client.get(reverse('home-page'))

    assert authenticated_response.status_code == status.HTTP_200_OK
    assert sorted(project['id'] for project in authenticated_response.data['featured_projects']) == sorted(
        [published.pk, draft.pk]
    )
    assert anonymous_response.status_code == status.HTTP_200_OK
    assert [project['id'] for project in anonymous_response.data['featured_projects']] == [
        published.pk
    ]


@pytest.mark.django_db
def test_home_page_patch_keeps_an_unpublished_featured_project_selected(api_client):
    """Falla si editar la portada elimina la selección administrativa de un borrador."""
    published = _featured_project('Published project', True)
    draft = _featured_project('Draft project', False)
    home = HomePage.load()
    api_client.force_authenticate(user=_role_user(User.ROLE_ADMIN))

    response = api_client.patch(
        reverse('home-page'),
        {'featured_project_ids': [published.pk, draft.pk]},
        format='json',
    )

    home.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert sorted(project['id'] for project in response.data['featured_projects']) == sorted(
        [published.pk, draft.pk]
    )
    assert sorted(home.featured_projects.values_list('pk', flat=True)) == sorted(
        [published.pk, draft.pk]
    )


@pytest.mark.django_db
def test_home_page_hides_selected_project_after_it_is_unpublished(api_client):
    """Falla si despublicar un destacado borra su selección o sigue mostrándolo públicamente."""
    project = _featured_project('Project to unpublish', True)
    home = HomePage.load()
    home.featured_projects.add(project)
    visible_response = api_client.get(reverse('home-page'))
    project.is_published = False
    project.save(update_fields=['is_published'])

    response = api_client.get(reverse('home-page'))
    home.refresh_from_db()

    assert [item['id'] for item in visible_response.data['featured_projects']] == [project.pk]
    assert response.status_code == status.HTTP_200_OK
    assert response.data['featured_projects'] == []
    assert list(home.featured_projects.values_list('pk', flat=True)) == [project.pk]
