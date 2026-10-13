"""Admin index contracts: only the client guide modules (document 242) are listed."""

import json

import pytest
from django.contrib.auth.models import Permission
from django.urls import reverse

from core_app.management.commands.check_client_delivery import REQUIRED_PERMISSIONS
from core_app.models import Tag, User

GUIDE_MODELS = {'HomePage', 'Post', 'Project', 'WarrantyDocument'}


def _listed_models(response):
    """Object names of the models an admin page lists, across its apps."""
    return {model['object_name'] for app in response.context['app_list'] for model in app['models']}


@pytest.fixture
def superuser(db):
    """Provide the ProjectApp administrator, who holds every permission."""
    return User.objects.create_superuser(email='admin-index@example.test', password='safe-password')


@pytest.fixture
def client_account(db):
    """Provide the client's staff account with exactly the check_client_delivery permissions."""
    account = User.objects.create_user(email='client-index@example.test', is_staff=True)
    account.user_permissions.add(*(
        Permission.objects.get(content_type__app_label=app_label, codename=codename)
        for app_label, codename in (permission.split('.') for permission in REQUIRED_PERMISSIONS)
    ))
    return account


@pytest.fixture
def tag_editor(db):
    """Provide a staff account whose only permission is creating tags."""
    editor = User.objects.create_user(email='tag-editor@example.test', is_staff=True)
    editor.user_permissions.add(Permission.objects.get(content_type__app_label='core_app', codename='add_tag'))
    return editor


@pytest.mark.django_db
@pytest.mark.parametrize('account', ['superuser', 'client_account'], ids=('superuser', 'client-account'))
def test_admin_index_lists_only_the_guide_modules(client, request, account):
    """Falla si el índice del admin vuelve a mostrar módulos que la guía del cliente no incluye."""
    client.force_login(request.getfixturevalue(account))

    response = client.get(reverse('admin:index'))

    assert response.status_code == 200
    assert _listed_models(response) == GUIDE_MODELS


@pytest.mark.django_db
@pytest.mark.parametrize('app_label', ['auth', 'token_blacklist', 'django_attachments'])
def test_admin_page_of_an_app_outside_the_guide_is_not_found(client, superuser, app_label):
    """Falla si grupos, tokens JWT o bibliotecas de imágenes vuelven a tener página propia en el admin."""
    client.force_login(superuser)

    response = client.get(reverse('admin:app_list', kwargs={'app_label': app_label}))

    assert response.status_code == 404


@pytest.mark.django_db
def test_core_app_admin_page_lists_only_the_guide_modules(client, superuser):
    """Falla si la página de la app vuelve a listar Leads, Servicios o Usuarios junto a los de la guía."""
    client.force_login(superuser)

    response = client.get(reverse('admin:app_list', kwargs={'app_label': 'core_app'}))

    assert response.status_code == 200
    assert _listed_models(response) == GUIDE_MODELS


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('url_name', 'expected_markup'),
    [
        (
            'admin:core_app_post_add',
            ('data-create-library-url="/admin/django_attachments/library/api/create/"', 'id="add_id_tags"'),
        ),
        (
            'admin:core_app_project_add',
            (
                'data-list-url="/admin/django_attachments/library/api/gallery/__library_id__/"',
                'id="add_id_categories"',
                'id="add_id_styles"',
                'id="add_id_spaces"',
            ),
        ),
    ],
    ids=('post', 'project'),
)
def test_guide_form_renders_the_widgets_backed_by_hidden_modules(client, client_account, url_name, expected_markup):
    """Falla si ocultar Libraries o la taxonomía rompe la carga de imágenes o los botones «+» del cliente."""
    client.force_login(client_account)

    response = client.get(reverse(url_name))
    html = response.content.decode()

    assert response.status_code == 200
    assert [markup for markup in expected_markup if markup not in html] == []


@pytest.mark.django_db
def test_tag_popup_returns_the_new_tag_to_the_post_form(client, tag_editor):
    """Falla si ocultar Tags del índice bloquea el «+» que crea una etiqueta desde el formulario de un post."""
    client.force_login(tag_editor)

    response = client.post(
        reverse('admin:core_app_tag_add'),
        {'name': 'Cocinas abiertas', 'slug': '', 'order': 2, '_popup': '1', '_to_field': 'id'},
    )

    tag = Tag.objects.get()
    assert response.status_code == 200
    assert (tag.name, tag.order) == ('Cocinas abiertas', 2)
    assert json.loads(response.context['popup_response_data'])['value'] == str(tag.pk)
