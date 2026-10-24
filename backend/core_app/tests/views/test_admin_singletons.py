"""Home admits a single record: the admin neither offers nor performs a second one, and says why."""

import pytest
from django.contrib.messages import get_messages
from django.urls import reverse

from core_app.models import HomePage, User

SINGLE_HOME_NOTICE = 'Solo puede existir un registro de «home page». Edite el existente.'


@pytest.fixture
def superuser(db):
    """Provide the ProjectApp administrator, who holds the add permission the client account lacks."""
    return User.objects.create_superuser(email='admin-home@example.test', password='safe-password')


@pytest.fixture
def home(db):
    """Provide the Home record the public site already serves."""
    home = HomePage.load()
    home.hero_title = 'Inicio vigente'
    home.save()
    return home


def _notices(response):
    return [str(message) for message in get_messages(response.wsgi_request)]


@pytest.mark.django_db
def test_home_changelist_offers_no_second_record_and_says_why(client, superuser, home):
    """Falla si la lista de Home vuelve a ofrecer «Add» o deja de avisar que sólo puede haber un registro."""
    client.force_login(superuser)

    response = client.get(reverse('admin:core_app_homepage_changelist'))

    assert response.status_code == 200
    assert response.context['has_add_permission'] is False
    assert reverse('admin:core_app_homepage_add') not in response.content.decode()
    assert _notices(response) == [SINGLE_HOME_NOTICE]


@pytest.mark.django_db
def test_home_add_sends_to_the_existing_record_without_overwriting_it(client, superuser, home):
    """Falla si «añadir» otra Home vuelve a pisar en silencio la existente, que save() fija en pk=1."""
    client.force_login(superuser)

    response = client.post(reverse('admin:core_app_homepage_add'), {'hero_title': 'Inicio duplicado'})

    home.refresh_from_db()
    assert response.status_code == 302
    assert response['Location'] == reverse('admin:core_app_homepage_change', args=[home.pk])
    assert (HomePage.objects.count(), home.hero_title) == (1, 'Inicio vigente')
    assert _notices(response) == [SINGLE_HOME_NOTICE]


@pytest.mark.django_db
def test_home_add_form_opens_while_no_home_exists(client, superuser):
    """Falla si la restricción también bloquea el primer registro de Home."""
    client.force_login(superuser)

    response = client.get(reverse('admin:core_app_homepage_add'))

    assert response.status_code == 200
    assert response.context['add'] is True
    assert HomePage.objects.count() == 0
