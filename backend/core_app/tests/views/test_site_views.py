"""HTTP authorization tests for singleton site configuration."""

import pytest
from django.urls import reverse
from rest_framework import status

from core_app.models import AboutPage, HomePage, SiteSettings, User

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
