"""Admin HTTP contracts for lead details collected by the public form."""

import pytest
from django.urls import reverse

from core_app.models import Lead, User


@pytest.fixture
def staff(db):
    """Provide an administrator allowed to inspect CRM leads."""
    return User.objects.create_superuser(
        email="admin@tenndalux.com",
        password="safe-password",
    )


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("field", "value"),
    [("city", "Bogotá, Chapinero"), ("spaces_count", 3)],
    ids=("location", "space-count"),
)
def test_lead_admin_change_form_renders_each_project_detail(client, staff, field, value):
    """Fails if CRM staff cannot see a project detail submitted by a visitor."""
    lead = Lead.objects.create(
        full_name="Jane Doe",
        email="jane@example.com",
        **{field: value},
    )
    client.force_login(staff)

    response = client.get(reverse("admin:core_app_lead_change", args=[lead.pk]))
    html = response.content.decode()

    assert response.status_code == 200
    assert f'id="id_{field}"' in html
    assert f'value="{value}"' in html
