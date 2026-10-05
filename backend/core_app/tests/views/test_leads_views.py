"""Lead capture validation and CRM authorization tests."""

from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import status

from core_app.models import Lead, LeadStatus, User


def _results(data):
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


@pytest.mark.django_db
def test_lead_statuses_list_allows_anonymous(api_client):
    """Fails if a public visitor cannot read available lead statuses."""
    LeadStatus.objects.create(name="New", order=0)

    url = reverse("lead-status-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(_results(response.data)) == 1


@pytest.mark.django_db
def test_lead_create_returns_only_public_fields(api_client):
    """Fails if public capture exposes CRM state in its successful response."""
    url = reverse("lead-list")
    response = api_client.post(
        url,
        {
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "message": "Hello",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert Lead.objects.count() == 1
    assert response.data["city"] == ""
    assert response.data["spaces_count"] is None
    assert {"status", "status_id", "notes"}.isdisjoint(response.data)


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("field", "value"),
    [("city", "Bogotá, Chapinero"), ("spaces_count", 3)],
    ids=("location", "space-count"),
)
def test_lead_capture_persists_each_project_detail(api_client, field, value):
    """Fails if public capture loses one submitted project detail."""
    response = api_client.post(
        reverse("lead-list"),
        {**_lead_payload(), field: value},
        format="json",
    )

    lead = Lead.objects.get()
    assert response.status_code == status.HTTP_201_CREATED
    assert getattr(lead, field) == value
    assert response.data[field] == value


@pytest.mark.django_db
@pytest.mark.parametrize(
    "spaces_count",
    [0, -1, 1.5, 2147483648],
    ids=("zero", "negative", "fractional", "above-maximum"),
)
def test_lead_capture_rejects_invalid_space_count(api_client, spaces_count):
    """Fails if public capture accepts an invalid number of spaces."""
    with patch("core_app.views.leads_views.send_lead_notification") as notify:
        response = api_client.post(
            reverse("lead-list"),
            {**_lead_payload(), "spaces_count": spaces_count},
            format="json",
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "spaces_count" in response.data
    assert Lead.objects.count() == 0
    notify.assert_not_called()


@pytest.mark.django_db
def test_lead_capture_rejects_location_longer_than_120_characters(api_client):
    """Fails if public capture stores a location beyond the CRM field limit."""
    with patch("core_app.views.leads_views.send_lead_notification") as notify:
        response = api_client.post(
            reverse("lead-list"),
            {**_lead_payload(), "city": "A" * 121},
            format="json",
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "city" in response.data
    assert Lead.objects.count() == 0
    notify.assert_not_called()


@pytest.mark.django_db
def test_lead_list_requires_jwt(api_client):
    """Fails if an unauthenticated caller can list contact submissions."""
    Lead.objects.create(full_name="Jane Doe", email="jane@example.com")

    url = reverse("lead-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def _lead_payload():
    return {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "message": "Hello",
    }


def _role_user(role):
    return User.objects.create_user(
        email=f"{role}-leads@example.com",
        password="safe-password",
        role=role,
    )


def _authenticate_as(api_client, role):
    if role is not None:
        api_client.force_authenticate(user=_role_user(role))


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [None, User.ROLE_VIEWER, User.ROLE_EDITOR, User.ROLE_ADMIN],
    ids=("anonymous", "viewer", "editor", "admin"),
)
@pytest.mark.parametrize(
    ("field", "value"),
    [("status", "new"), ("status_id", 1), ("notes", "internal note")],
    ids=("status", "status-id", "notes"),
)
def test_lead_capture_rejects_reserved_crm_field(api_client, role, field, value):
    """Fails if a public lead request can assign CRM status or notes."""
    LeadStatus.objects.create(pk=1, name="New", order=0)
    payload = _lead_payload()
    payload[field] = value
    _authenticate_as(api_client, role)
    before = Lead.objects.count()

    response = api_client.post(reverse("lead-list"), payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert field in response.data
    assert Lead.objects.count() == before


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("role", "expected_status"),
    [
        (User.ROLE_VIEWER, status.HTTP_403_FORBIDDEN),
        (User.ROLE_EDITOR, status.HTTP_403_FORBIDDEN),
    ],
    ids=("viewer", "editor"),
)
@pytest.mark.parametrize("method", ["get", "patch"], ids=("GET", "PATCH"))
def test_lead_crm_rejects_non_admin(api_client, role, expected_status, method):
    """Fails if a viewer or editor can read or modify a CRM lead."""
    lead = Lead.objects.create(
        full_name="Jane Doe", email="jane@example.com", notes="Before"
    )
    api_client.force_authenticate(user=_role_user(role))
    url = reverse("lead-detail", kwargs={"pk": lead.pk})

    response = getattr(api_client, method)(url, {"notes": "After"}, format="json")

    lead.refresh_from_db()
    assert response.status_code == expected_status
    assert lead.notes == "Before"


@pytest.mark.django_db
def test_lead_crm_patch_persists_for_admin(api_client):
    """Fails if an administrator can no longer assign a lead status or notes."""
    initial_status = LeadStatus.objects.create(name="New", order=0)
    assigned_status = LeadStatus.objects.create(name="Qualified", order=1)
    lead = Lead.objects.create(
        full_name="Jane Doe",
        email="jane@example.com",
        status=initial_status,
        notes="Before",
    )
    api_client.force_authenticate(user=_role_user(User.ROLE_ADMIN))

    response = api_client.patch(
        reverse("lead-detail", kwargs={"pk": lead.pk}),
        {"status_id": assigned_status.pk, "notes": "After"},
        format="json",
    )

    lead.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert lead.status_id == assigned_status.pk
    assert lead.notes == "After"


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("role", "expected_status"),
    [
        (None, status.HTTP_401_UNAUTHORIZED),
        (User.ROLE_VIEWER, status.HTTP_403_FORBIDDEN),
        (User.ROLE_EDITOR, status.HTTP_403_FORBIDDEN),
    ],
    ids=("anonymous", "viewer", "editor"),
)
def test_lead_status_create_rejects_non_admin(api_client, role, expected_status):
    """Fails if a non-admin can create a lead workflow status."""
    _authenticate_as(api_client, role)
    before = LeadStatus.objects.count()

    response = api_client.post(
        reverse("lead-status-list"), {"name": "New", "order": 0}, format="json"
    )

    assert response.status_code == expected_status
    assert LeadStatus.objects.count() == before


@pytest.mark.django_db
def test_lead_status_create_persists_for_admin(api_client):
    """Fails if an administrator can no longer create a lead workflow status."""
    api_client.force_authenticate(user=_role_user(User.ROLE_ADMIN))

    response = api_client.post(
        reverse("lead-status-list"), {"name": "New", "order": 0}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert LeadStatus.objects.get(pk=response.data["id"]).name == "New"
