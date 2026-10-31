"""Public reads, fixed seed data and model permissions for products."""

from importlib import import_module

import pytest
from django.apps import apps
from django.contrib.auth.models import Permission
from django.db import connection
from django.urls import reverse

from core_app.models import Product, User


@pytest.mark.django_db
def test_public_catalogue_contains_the_fifteen_products_in_the_original_order(api_client, django_assert_num_queries):
    with django_assert_num_queries(1):
        response = api_client.get(reverse('products'))

    assert response.status_code == 200
    assert len(response.data) == 15
    assert response.data[0] == {
        'key': 'ondessence', 'name': 'Cortina Ondessence', 'category': 'cortinas-diseno',
        'description': 'La evolución moderna de la cortina tradicional con sistema Ripplefold',
        'image_url': '/products/ondessence/ondessence-principal.webp',
    }
    assert response.data[-1]['key'] == 'peliculas-solares'
    assert {entry['category'] for entry in response.data} == {
        'cortinas-diseno', 'soluciones-practicas', 'persianas', 'exteriores', 'recubrimientos',
    }
    assert 'no-store' in response['Cache-Control']


@pytest.mark.django_db
def test_public_catalogue_reflects_saved_product_edits(api_client):
    product = Product.objects.get(key='ondessence')
    product.name, product.description, product.category = 'Nombre nuevo', 'Descripción nueva', 'exteriores'
    product.image = 'products/unique-replacement.png'
    product.save()

    response = api_client.get(reverse('products'))

    assert response.data[0] == {
        'key': 'ondessence', 'name': 'Nombre nuevo', 'description': 'Descripción nueva',
        'category': 'exteriores', 'image_url': '/media/products/unique-replacement.png',
    }


@pytest.mark.django_db
def test_repeating_the_seed_preserves_client_edits():
    product = Product.objects.get(key='ondessence')
    product.name = 'Nombre elegido por el cliente'
    product.save()

    import_module('core_app.migrations.0009_seed_products').seed_products(apps, connection.schema_editor())
    product.refresh_from_db()

    assert product.name == 'Nombre elegido por el cliente'
    assert Product.objects.count() == 15


@pytest.mark.django_db
@pytest.mark.parametrize('method', ['post', 'put', 'patch', 'delete'])
def test_public_catalogue_rejects_write_methods(api_client, method):
    response = getattr(api_client, method)(reverse('products'), {'name': 'Unauthorized'}, format='json')

    assert response.status_code == 405
    assert Product.objects.get(key='ondessence').name == 'Cortina Ondessence'
    assert Product.objects.count() == 15


@pytest.mark.django_db
@pytest.mark.parametrize('action', ['add', 'delete'])
@pytest.mark.parametrize('method', ['get', 'post'])
def test_even_a_superuser_cannot_create_or_delete_products(client, action, method):
    admin = User.objects.create_superuser(email='product-superuser@example.test', password='test-only-password')
    client.force_login(admin)
    product = Product.objects.get(key='ondessence')
    url = reverse(f'admin:core_app_product_{action}', args=[product.pk] if action == 'delete' else [])

    response = getattr(client, method)(url)

    assert response.status_code == 403
    assert Product.objects.count() == 15


@pytest.mark.django_db
@pytest.mark.parametrize('permission', ['', 'view_product'])
def test_staff_without_product_change_permission_cannot_edit_products(client, permission):
    user = User.objects.create_user(email='readonly-products@example.test', is_staff=True)
    user.user_permissions.set(Permission.objects.filter(codename=permission, content_type__app_label='core_app'))
    client.force_login(user)
    product = Product.objects.get(key='ondessence')

    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), {'name': 'Blocked'})

    assert response.status_code == 403
    product.refresh_from_db()
    assert product.name == 'Cortina Ondessence'
