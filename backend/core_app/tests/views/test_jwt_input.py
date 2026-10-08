"""Public refresh endpoint contracts for untrusted JWT input."""

import base64
from datetime import datetime, timedelta, timezone

import pytest
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken


def _nested_header_token():
    header = base64.urlsafe_b64encode(b"[" * 200000 + b"0" + b"]" * 200000).rstrip(b"=")
    return header.decode() + ".e30.c2lnbmF0dXJl"


@pytest.mark.django_db
def test_refresh_rejects_deeply_nested_header(api_client):
    """Fails if untrusted JWT header parsing escapes the controlled refresh rejection."""
    response = api_client.post(
        reverse("token-refresh"), {"refresh": _nested_header_token()}, format="json"
    )

    assert response.status_code == 401
    assert response.data["code"] == "token_not_valid"
    assert "access" not in response.data


@pytest.mark.django_db
def test_refresh_preserves_token_rotation(api_client, existing_user):
    """Fails if the dependency patch stops renewing a valid session."""
    original = RefreshToken.for_user(existing_user)
    response = api_client.post(
        reverse("token-refresh"), {"refresh": str(original)}, format="json"
    )

    assert response.status_code == 200
    assert response.data["refresh"] != str(original)
    assert AccessToken(response.data["access"])["user_id"] == str(existing_user.pk)


@pytest.mark.django_db
def test_refresh_rejects_rotated_token_replay(api_client, existing_user):
    """Fails if the old refresh token remains usable after rotation."""
    original = str(RefreshToken.for_user(existing_user))
    first = api_client.post(reverse("token-refresh"), {"refresh": original}, format="json")
    response = api_client.post(reverse("token-refresh"), {"refresh": original}, format="json")

    assert first.status_code == 200
    assert response.status_code == 401
    assert response.data["code"] == "token_not_valid"


@pytest.mark.django_db
def test_refresh_rejects_expired_token(api_client, existing_user):
    """Fails if the patched verifier accepts an expired refresh credential."""
    expired = RefreshToken.for_user(existing_user)
    expired.set_exp(from_time=datetime(2000, 1, 1, tzinfo=timezone.utc), lifetime=timedelta(days=1))
    response = api_client.post(
        reverse("token-refresh"), {"refresh": str(expired)}, format="json"
    )

    assert response.status_code == 401
    assert response.data["code"] == "token_not_valid"


@pytest.mark.django_db
def test_refresh_rejects_invalid_signature(api_client, existing_user):
    """Fails if an altered refresh token bypasses signature verification."""
    original = str(RefreshToken.for_user(existing_user))
    header, payload, _signature = original.split(".")
    response = api_client.post(
        reverse("token-refresh"), {"refresh": f"{header}.{payload}.c2lnbmF0dXJl"}, format="json"
    )

    assert response.status_code == 401
    assert response.data["code"] == "token_not_valid"
