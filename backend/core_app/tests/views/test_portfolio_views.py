"""Portfolio API visibility and role-authorization tests."""

import pytest
from django.urls import reverse
from rest_framework import status

from core_app.models import Category, Project, Space, Style, User


def _results(data):
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


@pytest.mark.django_db
def test_category_list_allows_anonymous(api_client):
    """Fails if a public visitor cannot read portfolio categories."""
    Category.objects.create(name="Residential")

    url = reverse("category-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(_results(response.data)) == 1


PORTFOLIO_RESOURCES = (
    (
        "category",
        Category,
        "category",
        {"name": "Existing category"},
        {"name": "New category"},
        {"name": "Updated category"},
        "name",
    ),
    (
        "style",
        Style,
        "style",
        {"name": "Existing style"},
        {"name": "New style"},
        {"name": "Updated style"},
        "name",
    ),
    (
        "space",
        Space,
        "space",
        {"name": "Existing space"},
        {"name": "New space"},
        {"name": "Updated space"},
        "name",
    ),
    (
        "project",
        Project,
        "project",
        {"title": "Existing project"},
        {"title": "New project"},
        {"title": "Updated project"},
        "title",
    ),
)


def _detail_url(route, instance):
    if route == "project":
        return reverse(f"{route}-detail", kwargs={"slug": instance.slug})
    return reverse(f"{route}-detail", kwargs={"pk": instance.pk})


def _role_user(role):
    return User.objects.create_user(
        email=f"{role}-portfolio@example.com",
        password="safe-password",
        role=role,
    )


def _authenticate_as(api_client, role):
    if role is not None:
        api_client.force_authenticate(user=_role_user(role))


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("role", "expected_status"),
    [
        (None, status.HTTP_401_UNAUTHORIZED),
        (User.ROLE_VIEWER, status.HTTP_403_FORBIDDEN),
    ],
    ids=("anonymous", "viewer"),
)
@pytest.mark.parametrize(
    (
        "resource",
        "model",
        "route",
        "target_payload",
        "create_payload",
        "update_payload",
        "field",
    ),
    PORTFOLIO_RESOURCES,
    ids=[item[0] for item in PORTFOLIO_RESOURCES],
)
def test_portfolio_create_rejects_unauthorized_writer(
    api_client,
    role,
    expected_status,
    resource,
    model,
    route,
    target_payload,
    create_payload,
    update_payload,
    field,
):
    """Fails if an anonymous visitor or viewer can create a portfolio CMS record."""
    model.objects.create(**target_payload)
    before = model.objects.count()
    _authenticate_as(api_client, role)

    response = api_client.post(reverse(f"{route}-list"), create_payload, format="json")

    assert response.status_code == expected_status
    assert model.objects.count() == before


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("role", "expected_status"),
    [
        (None, status.HTTP_401_UNAUTHORIZED),
        (User.ROLE_VIEWER, status.HTTP_403_FORBIDDEN),
    ],
    ids=("anonymous", "viewer"),
)
@pytest.mark.parametrize(
    (
        "resource",
        "model",
        "route",
        "target_payload",
        "create_payload",
        "update_payload",
        "field",
    ),
    PORTFOLIO_RESOURCES,
    ids=[item[0] for item in PORTFOLIO_RESOURCES],
)
def test_portfolio_patch_rejects_unauthorized_writer(
    api_client,
    role,
    expected_status,
    resource,
    model,
    route,
    target_payload,
    create_payload,
    update_payload,
    field,
):
    """Fails if an anonymous visitor or viewer can partially update a portfolio CMS record."""
    target = model.objects.create(**target_payload)
    _authenticate_as(api_client, role)

    response = api_client.patch(
        _detail_url(route, target), update_payload, format="json"
    )

    target.refresh_from_db()
    assert response.status_code == expected_status
    assert getattr(target, field) == target_payload[field]


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("role", "expected_status"),
    [
        (None, status.HTTP_401_UNAUTHORIZED),
        (User.ROLE_VIEWER, status.HTTP_403_FORBIDDEN),
    ],
    ids=("anonymous", "viewer"),
)
@pytest.mark.parametrize(
    (
        "resource",
        "model",
        "route",
        "target_payload",
        "create_payload",
        "update_payload",
        "field",
    ),
    PORTFOLIO_RESOURCES,
    ids=[item[0] for item in PORTFOLIO_RESOURCES],
)
def test_portfolio_put_rejects_unauthorized_writer(
    api_client,
    role,
    expected_status,
    resource,
    model,
    route,
    target_payload,
    create_payload,
    update_payload,
    field,
):
    """Fails if an anonymous visitor or viewer can replace a portfolio CMS record."""
    target = model.objects.create(**target_payload)
    _authenticate_as(api_client, role)

    response = api_client.put(_detail_url(route, target), update_payload, format="json")

    target.refresh_from_db()
    assert response.status_code == expected_status
    assert getattr(target, field) == target_payload[field]


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("role", "expected_status"),
    [
        (None, status.HTTP_401_UNAUTHORIZED),
        (User.ROLE_VIEWER, status.HTTP_403_FORBIDDEN),
    ],
    ids=("anonymous", "viewer"),
)
@pytest.mark.parametrize(
    (
        "resource",
        "model",
        "route",
        "target_payload",
        "create_payload",
        "update_payload",
        "field",
    ),
    PORTFOLIO_RESOURCES,
    ids=[item[0] for item in PORTFOLIO_RESOURCES],
)
def test_portfolio_delete_rejects_unauthorized_writer(
    api_client,
    role,
    expected_status,
    resource,
    model,
    route,
    target_payload,
    create_payload,
    update_payload,
    field,
):
    """Fails if an anonymous visitor or viewer can delete a portfolio CMS record."""
    target = model.objects.create(**target_payload)
    _authenticate_as(api_client, role)

    response = api_client.delete(_detail_url(route, target))

    assert response.status_code == expected_status
    assert model.objects.filter(pk=target.pk).exists() is True


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role", [User.ROLE_EDITOR, User.ROLE_ADMIN], ids=("editor", "admin")
)
@pytest.mark.parametrize(
    (
        "resource",
        "model",
        "route",
        "target_payload",
        "create_payload",
        "update_payload",
        "field",
    ),
    PORTFOLIO_RESOURCES,
    ids=[item[0] for item in PORTFOLIO_RESOURCES],
)
def test_portfolio_create_persists_for_content_manager(
    api_client,
    role,
    resource,
    model,
    route,
    target_payload,
    create_payload,
    update_payload,
    field,
):
    """Fails if a content manager loses portfolio creation access."""
    api_client.force_authenticate(user=_role_user(role))

    response = api_client.post(reverse(f"{route}-list"), create_payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    created = model.objects.get(pk=response.data["id"])
    assert getattr(created, field) == create_payload[field]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role", [User.ROLE_EDITOR, User.ROLE_ADMIN], ids=("editor", "admin")
)
@pytest.mark.parametrize(
    (
        "resource",
        "model",
        "route",
        "target_payload",
        "create_payload",
        "update_payload",
        "field",
    ),
    PORTFOLIO_RESOURCES,
    ids=[item[0] for item in PORTFOLIO_RESOURCES],
)
def test_portfolio_patch_persists_for_content_manager(
    api_client,
    role,
    resource,
    model,
    route,
    target_payload,
    create_payload,
    update_payload,
    field,
):
    """Fails if a content manager loses portfolio partial-update access."""
    target = model.objects.create(**target_payload)
    api_client.force_authenticate(user=_role_user(role))

    response = api_client.patch(
        _detail_url(route, target), update_payload, format="json"
    )

    target.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert getattr(target, field) == update_payload[field]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role", [User.ROLE_EDITOR, User.ROLE_ADMIN], ids=("editor", "admin")
)
@pytest.mark.parametrize(
    (
        "resource",
        "model",
        "route",
        "target_payload",
        "create_payload",
        "update_payload",
        "field",
    ),
    PORTFOLIO_RESOURCES,
    ids=[item[0] for item in PORTFOLIO_RESOURCES],
)
def test_portfolio_put_persists_for_content_manager(
    api_client,
    role,
    resource,
    model,
    route,
    target_payload,
    create_payload,
    update_payload,
    field,
):
    """Fails if a content manager loses portfolio replacement access."""
    target = model.objects.create(**target_payload)
    api_client.force_authenticate(user=_role_user(role))

    response = api_client.put(_detail_url(route, target), update_payload, format="json")

    target.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert getattr(target, field) == update_payload[field]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role", [User.ROLE_EDITOR, User.ROLE_ADMIN], ids=("editor", "admin")
)
@pytest.mark.parametrize(
    (
        "resource",
        "model",
        "route",
        "target_payload",
        "create_payload",
        "update_payload",
        "field",
    ),
    PORTFOLIO_RESOURCES,
    ids=[item[0] for item in PORTFOLIO_RESOURCES],
)
def test_portfolio_delete_persists_for_content_manager(
    api_client,
    role,
    resource,
    model,
    route,
    target_payload,
    create_payload,
    update_payload,
    field,
):
    """Fails if a content manager loses portfolio deletion access."""
    target = model.objects.create(**target_payload)
    api_client.force_authenticate(user=_role_user(role))

    response = api_client.delete(_detail_url(route, target))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert model.objects.filter(pk=target.pk).exists() is False


@pytest.mark.django_db
def test_project_list_filters_only_published_for_anonymous(api_client):
    """Fails if a public portfolio list exposes an unpublished project."""
    Project.objects.create(title="Public", is_published=True)
    Project.objects.create(title="Hidden", is_published=False)

    url = reverse("project-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    titles = {item["title"] for item in _results(response.data)}
    assert titles == {"Public"}


@pytest.mark.django_db
def test_project_list_returns_all_for_authenticated(api_client, existing_user):
    """Fails if an authenticated CMS reader cannot see an unpublished project."""
    Project.objects.create(title="Public", is_published=True)
    Project.objects.create(title="Hidden", is_published=False)

    api_client.force_authenticate(user=existing_user)

    url = reverse("project-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    titles = {item["title"] for item in _results(response.data)}
    assert titles == {"Public", "Hidden"}
