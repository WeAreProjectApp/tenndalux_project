"""Services API visibility and role-authorization tests."""

import pytest
from django.urls import reverse
from rest_framework import status

from core_app.models import ProcessStep, Service, User


def _results(data):
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


@pytest.mark.django_db
def test_service_list_filters_only_active_for_anonymous(api_client):
    """Fails if a public services list exposes an inactive service."""
    Service.objects.create(title="Active", is_active=True)
    Service.objects.create(title="Inactive", is_active=False)

    url = reverse("service-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    titles = {item["title"] for item in _results(response.data)}
    assert titles == {"Active"}


@pytest.mark.django_db
def test_service_list_returns_all_for_authenticated(api_client, existing_user):
    """Fails if an authenticated CMS reader cannot see an inactive service."""
    Service.objects.create(title="Active", is_active=True)
    Service.objects.create(title="Inactive", is_active=False)

    api_client.force_authenticate(user=existing_user)

    url = reverse("service-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    titles = {item["title"] for item in _results(response.data)}
    assert titles == {"Active", "Inactive"}


@pytest.mark.django_db
def test_process_steps_list_filters_only_active_for_anonymous(api_client):
    """Fails if a public process list exposes an inactive step."""
    ProcessStep.objects.create(title="Active", is_active=True)
    ProcessStep.objects.create(title="Inactive", is_active=False)

    url = reverse("process-step-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    titles = {item["title"] for item in _results(response.data)}
    assert titles == {"Active"}


SERVICE_RESOURCES = (
    (
        "service",
        Service,
        "service",
        {"title": "Existing service"},
        {"title": "New service"},
        {"title": "Updated service"},
        "title",
    ),
    (
        "process-step",
        ProcessStep,
        "process-step",
        {"title": "Existing step"},
        {"title": "New step"},
        {"title": "Updated step"},
        "title",
    ),
)


def _role_user(role):
    return User.objects.create_user(
        email=f"{role}-services@example.com",
        password="safe-password",
        role=role,
    )


def _authenticate_as(api_client, role):
    if role is not None:
        api_client.force_authenticate(user=_role_user(role))


def _detail_url(route, instance):
    return reverse(f"{route}-detail", kwargs={"pk": instance.pk})


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
    SERVICE_RESOURCES,
    ids=[item[0] for item in SERVICE_RESOURCES],
)
def test_services_create_rejects_unauthorized_writer(
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
    """Fails if an anonymous visitor or viewer can create a services CMS record."""
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
    SERVICE_RESOURCES,
    ids=[item[0] for item in SERVICE_RESOURCES],
)
def test_services_patch_rejects_unauthorized_writer(
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
    """Fails if an anonymous visitor or viewer can partially update a services CMS record."""
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
    SERVICE_RESOURCES,
    ids=[item[0] for item in SERVICE_RESOURCES],
)
def test_services_put_rejects_unauthorized_writer(
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
    """Fails if an anonymous visitor or viewer can replace a services CMS record."""
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
    SERVICE_RESOURCES,
    ids=[item[0] for item in SERVICE_RESOURCES],
)
def test_services_delete_rejects_unauthorized_writer(
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
    """Fails if an anonymous visitor or viewer can delete a services CMS record."""
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
    SERVICE_RESOURCES,
    ids=[item[0] for item in SERVICE_RESOURCES],
)
def test_services_create_persists_for_content_manager(
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
    """Fails if a content manager loses services creation access."""
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
    SERVICE_RESOURCES,
    ids=[item[0] for item in SERVICE_RESOURCES],
)
def test_services_patch_persists_for_content_manager(
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
    """Fails if a content manager loses services partial-update access."""
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
    SERVICE_RESOURCES,
    ids=[item[0] for item in SERVICE_RESOURCES],
)
def test_services_put_persists_for_content_manager(
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
    """Fails if a content manager loses services replacement access."""
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
    SERVICE_RESOURCES,
    ids=[item[0] for item in SERVICE_RESOURCES],
)
def test_services_delete_persists_for_content_manager(
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
    """Fails if a content manager loses services deletion access."""
    target = model.objects.create(**target_payload)
    api_client.force_authenticate(user=_role_user(role))

    response = api_client.delete(_detail_url(route, target))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert model.objects.filter(pk=target.pk).exists() is False
