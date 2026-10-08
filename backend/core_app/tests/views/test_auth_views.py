"""Authentication endpoint behavior tests."""

import pytest
from django.urls import reverse
from rest_framework import status

from core_app.models import User


@pytest.mark.django_db
def test_register_user_success(api_client):
    """Fails if valid self-service registration stops issuing an authenticated session."""
    url = reverse("register-user")
    response = api_client.post(
        url,
        {
            "email": "new_user@example.com",
            "password": "Satin!48Drape#62",
            "password_confirm": "Satin!48Drape#62",
            "first_name": "New",
            "last_name": "User",
            "phone": "123456789",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert "tokens" in response.data
    assert "access" in response.data["tokens"]
    assert "refresh" in response.data["tokens"]
    registered = User.objects.get(email="new_user@example.com")
    assert registered.check_password("Satin!48Drape#62")
    assert registered.role == User.ROLE_VIEWER


@pytest.mark.django_db
def test_login_user_success(api_client, existing_user):
    """Fails if valid credentials stop creating a JWT session."""
    url = reverse("login-user")
    response = api_client.post(
        url,
        {
            "email": existing_user.email,
            "password": "existingpassword",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "tokens" in response.data
    assert response.data["user"]["email"] == existing_user.email


@pytest.mark.django_db
def test_get_user_profile_success(api_client, existing_user):
    """Fails if an authenticated user cannot retrieve their profile."""
    api_client.force_authenticate(user=existing_user)
    url = reverse("get-user-profile")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["user"]["email"] == existing_user.email


@pytest.mark.django_db
def test_registration_ignores_privilege_fields(api_client):
    """Fails if registration payload fields can create a privileged account."""
    email = "privilege-attempt@example.com"
    response = api_client.post(
        reverse("register-user"),
        {
            "email": email,
            "password": "newuserpassword",
            "password_confirm": "newuserpassword",
            "role": User.ROLE_ADMIN,
            "is_staff": True,
            "is_superuser": True,
        },
        format="json",
    )

    registered = User.objects.get(email=email)
    assert response.status_code == status.HTTP_201_CREATED
    assert registered.role == User.ROLE_VIEWER
    assert registered.is_staff is False
    assert registered.is_superuser is False


@pytest.mark.django_db
def test_profile_update_ignores_privilege_fields(api_client, existing_user):
    """Fails if a viewer can elevate their own role through the profile endpoint."""
    api_client.force_authenticate(user=existing_user)

    response = api_client.patch(
        reverse("update-user-profile"),
        {
            "first_name": "Viewer",
            "role": User.ROLE_ADMIN,
            "is_staff": True,
            "is_superuser": True,
        },
        format="json",
    )

    existing_user.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert existing_user.first_name == "Viewer"
    assert existing_user.role == User.ROLE_VIEWER
    assert existing_user.is_staff is False
    assert existing_user.is_superuser is False


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("password", "email", "first_name", "expected_error"),
    [
        ("password123", "weak@example.test", "", "too common"),
        ("98374012", "weak@example.test", "", "entirely numeric"),
        ("marioncarrillo", "marioncarrillo@example.test", "", "similar to the email"),
        ("CamilaVargas", "weak@example.test", "CamilaVargas", "similar to the first name"),
    ],
    ids=("common", "numeric", "email-similarity", "name-similarity"),
)
def test_registration_rejects_invalid_password(api_client, password, email, first_name, expected_error):
    """Fails if public registration bypasses a configured Django password validator."""
    response = api_client.post(
        reverse("register-user"),
        {"email": email, "password": password, "password_confirm": password, "first_name": first_name},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert expected_error in str(response.data["details"]["password"])
    assert not User.objects.filter(email=email).exists()
    assert "tokens" not in response.data


@pytest.mark.django_db
def test_registration_rejects_password_confirmation(api_client):
    """Fails if a password policy change allows mismatched confirmation to create an account."""
    email = "mismatch@example.test"
    response = api_client.post(
        reverse("register-user"),
        {"email": email, "password": "Satin!48Drape#62", "password_confirm": "Different!48Drape"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "password_confirm" in response.data["details"]
    assert not User.objects.filter(email=email).exists()
    assert "tokens" not in response.data
