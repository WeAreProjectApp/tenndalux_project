"""Admin branding: the client wants it to read only «Módulo administrativo», never «Django»."""

import pytest
from django.urls import reverse

from core_app.models import User

SITE_NAME_MARKUP = '<div id="site-name"><a href="/admin/">Módulo administrativo</a></div>'


@pytest.fixture
def superuser(db):
    """Provide the ProjectApp administrator, who sees the whole admin index."""
    return User.objects.create_superuser(email='admin-branding@example.test', password='safe-password')


@pytest.mark.django_db
def test_admin_index_reads_only_modulo_administrativo(client, superuser):
    """Falla si el índice del admin vuelve a mostrar «Django» en la pestaña, la cabecera o el título."""
    client.force_login(superuser)

    response = client.get(reverse('admin:index'))
    html = response.content.decode()

    assert response.status_code == 200
    assert '<title>Módulo administrativo</title>' in html
    assert SITE_NAME_MARKUP in html
    assert '<h1>Módulo administrativo</h1>' in html
    assert 'Django' not in html


@pytest.mark.django_db
def test_admin_login_page_reads_only_modulo_administrativo(client):
    """Falla si la pantalla de ingreso vuelve a decir «Django administration» o «Django site admin»."""
    response = client.get(reverse('admin:login'))
    html = response.content.decode()

    assert response.status_code == 200
    assert '<title>Log in | Módulo administrativo</title>' in html
    assert SITE_NAME_MARKUP in html
    assert 'Django' not in html
