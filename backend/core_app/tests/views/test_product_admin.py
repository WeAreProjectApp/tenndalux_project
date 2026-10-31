"""The client can change presentation without changing the fixed catalogue."""

from io import BytesIO

import pytest
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image

from core_app.models import Product, User


@pytest.fixture
def product(db):
    return Product.objects.get(key='ondessence')


@pytest.fixture
def editor(db, client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path / 'media'
    user = User.objects.create_user(email='products@example.test', is_staff=True)
    user.user_permissions.set(Permission.objects.filter(
        content_type__app_label='core_app', codename__in=('view_product', 'change_product'),
    ))
    client.force_login(user)
    return user


def image_upload(filename='curtain.png', image_format='PNG'):
    source = BytesIO()
    Image.new('RGB', (12, 16), 'green').save(source, format=image_format)
    return SimpleUploadedFile(filename, source.getvalue(), content_type='application/octet-stream')


def edit_data(product, **changes):
    return {'name': product.name, 'category': product.category, 'description': product.description, **changes}


@pytest.mark.django_db
def test_product_form_exposes_only_the_four_editable_fields(client, editor, product):
    response = client.get(reverse('admin:core_app_product_change', args=[product.pk]))

    assert response.status_code == 200
    assert set(response.context['adminform'].form.fields) == {'name', 'category', 'description', 'image'}
    assert product.default_image in response.content.decode()


@pytest.mark.django_db
def test_client_edits_presentation_without_changing_product_identity(client, editor, product):
    """Falla si guardar cambia la identidad o acepta campos ocultos enviados a mano."""
    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), edit_data(
        product, name='Ondas de lino', category='persianas', description='Lino natural a medida.',
        key='replacement', order=999, default_image='/wrong.png', idealPara='Sobrescrito',
    ))
    product.refresh_from_db()

    assert response.status_code == 302
    assert (product.name, product.category, product.description) == ('Ondas de lino', 'persianas', 'Lino natural a medida.')
    assert (product.key, product.order, product.default_image) == (
        'ondessence', 0, '/products/ondessence/ondessence-principal.webp',
    )
    assert Product.objects.count() == 15


@pytest.mark.django_db
@pytest.mark.parametrize(('filename', 'image_format'), [
    ('curtain.jpg', 'JPEG'), ('curtain.jpeg', 'JPEG'), ('curtain.png', 'PNG'),
    ('curtain.webp', 'WEBP'), ('curtain.gif', 'GIF'),
])
def test_client_uploads_a_supported_product_image(client, editor, product, filename, image_format):
    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), edit_data(
        product, image=image_upload(filename, image_format),
    ))
    product.refresh_from_db()

    assert response.status_code == 302
    assert product.image.name.startswith('products/')
    assert product.image.name != f'products/{filename}'
    with Image.open(product.image) as saved:
        assert saved.size == (12, 16)


@pytest.mark.django_db
@pytest.mark.parametrize(('filename', 'content'), [
    ('curtain.png', b'not-an-image'),
    ('curtain.html', b'<script>alert(1)</script>'),
    ('curtain.svg', b'<svg xmlns="http://www.w3.org/2000/svg"/>'),
])
def test_client_cannot_publish_active_or_invalid_image_bytes(client, editor, product, filename, content):
    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), edit_data(
        product, image=SimpleUploadedFile(filename, content, content_type='image/png'),
    ))
    product.refresh_from_db()

    assert response.status_code == 200
    assert 'image' in response.context['adminform'].form.errors
    assert not product.image


@pytest.mark.django_db
def test_client_cannot_disguise_a_verified_image_as_executable_html(client, editor, product):
    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), edit_data(
        product, image=image_upload('curtain.html'),
    ))
    product.refresh_from_db()

    assert response.status_code == 200
    assert 'image' in response.context['adminform'].form.errors
    assert not product.image


@pytest.mark.django_db
def test_client_cannot_upload_an_image_over_five_megabytes(client, editor, product):
    upload = image_upload()
    oversized = SimpleUploadedFile('large.png', upload.read() + b'\0' * (5 * 1024 * 1024))
    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), edit_data(product, image=oversized))

    assert response.status_code == 200
    assert 'La imagen debe pesar como máximo 5 MB.' in response.context['adminform'].form.errors['image']


@pytest.mark.django_db
def test_client_cannot_add_a_new_category_through_the_product_form(client, editor, product):
    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), edit_data(product, category='new-category'))
    product.refresh_from_db()

    assert response.status_code == 200
    assert 'category' in response.context['adminform'].form.errors
    assert product.category == 'cortinas-diseno'


@pytest.mark.django_db
@pytest.mark.parametrize('field', ['name', 'description'])
def test_client_cannot_blank_required_product_text(client, editor, product, field):
    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), edit_data(product, **{field: ''}))

    assert response.status_code == 200
    assert field in response.context['adminform'].form.errors


@pytest.mark.django_db
def test_clearing_an_uploaded_image_restores_the_original_photo(client, editor, product):
    product.image = image_upload()
    product.save()

    response = client.post(reverse('admin:core_app_product_change', args=[product.pk]), edit_data(product, **{'image-clear': 'on'}))
    product.refresh_from_db()

    assert response.status_code == 302
    assert product.image_url == '/products/ondessence/ondessence-principal.webp'
