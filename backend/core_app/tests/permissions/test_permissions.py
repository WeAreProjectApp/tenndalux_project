"""Permission matrices for the public API role boundaries."""

import pytest
from core_app.models import User
from core_app.permissions import (
    IsContentEditorOrReadOnly,
    IsRoleAdmin,
    IsRoleAdminOrReadOnly,
)
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

SAFE_METHODS = ("GET", "HEAD", "OPTIONS")
UNSAFE_METHODS = ("POST", "PUT", "PATCH", "DELETE")


def _anonymous():
    return AnonymousUser()


def _viewer():
    return User(email="viewer@example.com", role=User.ROLE_VIEWER, is_active=True)


def _editor():
    return User(email="editor@example.com", role=User.ROLE_EDITOR, is_active=True)


def _admin():
    return User(email="admin@example.com", role=User.ROLE_ADMIN, is_active=True)


def _staff_viewer():
    return User(
        email="staff-viewer@example.com",
        role=User.ROLE_VIEWER,
        is_active=True,
        is_staff=True,
    )


def _superuser():
    return User(
        email="superuser@example.com",
        role=User.ROLE_VIEWER,
        is_active=True,
        is_staff=True,
        is_superuser=True,
    )


def _inactive_admin():
    return User(
        email="inactive-admin@example.com", role=User.ROLE_ADMIN, is_active=False
    )


ACTOR_FACTORIES = {
    "anonymous": _anonymous,
    "viewer": _viewer,
    "editor": _editor,
    "admin": _admin,
    "staff-viewer": _staff_viewer,
    "superuser": _superuser,
    "inactive-admin": _inactive_admin,
}

FAMILY_EXPECTATIONS = (
    (
        "content-editor",
        IsContentEditorOrReadOnly,
        (
            ("anonymous", True, False),
            ("viewer", True, False),
            ("editor", True, True),
            ("admin", True, True),
            ("staff-viewer", True, False),
            ("superuser", True, True),
            ("inactive-admin", True, False),
        ),
    ),
    (
        "role-admin",
        IsRoleAdmin,
        (
            ("anonymous", False, False),
            ("viewer", False, False),
            ("editor", False, False),
            ("admin", True, True),
            ("staff-viewer", False, False),
            ("superuser", True, True),
            ("inactive-admin", False, False),
        ),
    ),
    (
        "role-admin-read",
        IsRoleAdminOrReadOnly,
        (
            ("anonymous", True, False),
            ("viewer", True, False),
            ("editor", True, False),
            ("admin", True, True),
            ("staff-viewer", True, False),
            ("superuser", True, True),
            ("inactive-admin", True, False),
        ),
    ),
)


def _permission_cases():
    return [
        (
            family_name,
            permission_class,
            method,
            actor_name,
            ACTOR_FACTORIES[actor_name],
            safe_expected if method in SAFE_METHODS else unsafe_expected,
        )
        for family_name, permission_class, actor_expectations in FAMILY_EXPECTATIONS
        for method in (*SAFE_METHODS, *UNSAFE_METHODS)
        for actor_name, safe_expected, unsafe_expected in actor_expectations
    ]


PERMISSION_CASES = _permission_cases()
PERMISSION_IDS = [
    f"{family_name}:{actor_name}:{method}"
    for family_name, _, method, actor_name, _, _ in PERMISSION_CASES
]


@pytest.mark.parametrize(
    (
        "family_name",
        "permission_class",
        "method",
        "actor_name",
        "actor_factory",
        "expected",
    ),
    PERMISSION_CASES,
    ids=PERMISSION_IDS,
)
def test_permission_family_returns_the_role_decision(
    family_name,
    permission_class,
    method,
    actor_name,
    actor_factory,
    expected,
):
    """Fails if a CMS or CRM permission accepts an actor outside its role contract."""
    request = getattr(APIRequestFactory(), method.lower())("/")
    request.user = actor_factory()

    allowed = permission_class().has_permission(request, view=None)

    assert allowed is expected
