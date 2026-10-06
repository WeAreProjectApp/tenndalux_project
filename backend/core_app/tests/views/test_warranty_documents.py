"""HTTP contracts for public warranty documents and the Home hero image."""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django_attachments.models import Attachment, Library
from rest_framework import status

from core_app.models import HomePage, User, WarrantyDocument


@pytest.fixture
def admin_user(db):
    """Provide an administrator allowed to publish warranty documents."""
    return User.objects.create_superuser(
        email='warranty-admin@example.test',
        password='safe-password',
    )


def _valid_pdf(name='warranty.pdf'):
    return SimpleUploadedFile(name, b'%PDF-1.4\nWarranty document', content_type='application/pdf')


def _warranty_document(title, order, is_published, filename):
    return WarrantyDocument.objects.create(
        title=title,
        order=order,
        is_published=is_published,
        document=f'warranties/{filename}.pdf',
    )


@pytest.mark.django_db
def test_admin_add_persists_a_valid_published_warranty_pdf(client, admin_user, tmp_path):
    """Falla si el administrador ya no puede publicar un PDF de garantía válido."""
    client.force_login(admin_user)

    with override_settings(MEDIA_ROOT=tmp_path):
        response = client.post(
            reverse('admin:core_app_warrantydocument_add'),
            {
                'title': 'Garantía integral',
                'document': _valid_pdf(),
                'order': 4,
                'is_published': 'on',
            },
        )

    document = WarrantyDocument.objects.get()
    assert response.status_code == status.HTTP_302_FOUND
    assert (document.title, document.order, document.is_published) == (
        'Garantía integral',
        4,
        True,
    )
    assert document.document.name.startswith('warranties/')


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('upload', 'error_message'),
    [
        (_valid_pdf('warranty.txt'), 'Seleccione un archivo PDF.'),
        (
            SimpleUploadedFile('warranty.pdf', b'not-a-pdf', content_type='application/pdf'),
            'El archivo no contiene un PDF válido.',
        ),
        (
            SimpleUploadedFile(
                'warranty.pdf',
                b'%PDF-' + b'x' * (5 * 1024 * 1024),
                content_type='application/pdf',
            ),
            'El PDF debe pesar como máximo 5 MB.',
        ),
    ],
    ids=('extension', 'signature', 'size'),
)
def test_admin_add_refuses_an_invalid_warranty_pdf(client, admin_user, upload, error_message, tmp_path):
    """Falla si un PDF inválido vuelve a poder guardarse como garantía pública."""
    client.force_login(admin_user)

    with override_settings(MEDIA_ROOT=tmp_path):
        response = client.post(
            reverse('admin:core_app_warrantydocument_add'),
            {'title': 'Documento inválido', 'document': upload, 'order': 0},
        )

    form_errors = response.context['adminform'].form.errors['document']
    assert response.status_code == status.HTTP_200_OK
    assert error_message in form_errors
    assert WarrantyDocument.objects.count() == 0


@pytest.mark.django_db
def test_warranty_api_returns_published_documents_in_configured_order(api_client):
    """Falla si el catálogo público filtra mal, altera el orden o expone campos internos."""
    last = _warranty_document('Posterior', 20, True, 'later')
    second = _warranty_document('Zeta', 5, True, 'zeta')
    first = _warranty_document('Alfabética', 5, True, 'alphabetical')
    _warranty_document('Borrador', 0, False, 'draft')

    response = api_client.get(reverse('warranty-documents'))

    assert response.status_code == status.HTTP_200_OK
    assert response.data == [
        {
            'id': first.pk,
            'title': 'Alfabética',
            'file_url': 'http://testserver/media/warranties/alphabetical.pdf',
        },
        {
            'id': second.pk,
            'title': 'Zeta',
            'file_url': 'http://testserver/media/warranties/zeta.pdf',
        },
        {
            'id': last.pk,
            'title': 'Posterior',
            'file_url': 'http://testserver/media/warranties/later.pdf',
        },
    ]


@pytest.mark.django_db
@pytest.mark.parametrize('method', ['post', 'put', 'patch', 'delete'])
def test_warranty_api_refuses_each_write_method_without_mutation(api_client, method):
    """Falla si un visitante puede modificar documentos de garantía por la API pública."""
    _warranty_document('Documento vigente', 0, True, 'current')
    before_count = WarrantyDocument.objects.count()

    response = getattr(api_client, method)(
        reverse('warranty-documents'),
        {'title': 'Intento externo'},
        format='json',
    )

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert WarrantyDocument.objects.count() == before_count


@pytest.mark.django_db
def test_home_api_returns_null_hero_url_without_a_primary_attachment(api_client):
    """Falla si una biblioteca de portada vacía deja una URL de imagen rota en Home."""
    home = HomePage.load()
    home.hero_media = Library.objects.create(title='Hero empty')
    home.save(update_fields=['hero_media'])

    response = api_client.get(reverse('home-page'))

    assert response.status_code == status.HTTP_200_OK
    assert response.data['hero_image_url'] is None


@pytest.mark.django_db
def test_home_api_returns_the_primary_attachment_url(api_client, tmp_path):
    """Falla si Home devuelve el id de biblioteca en lugar de la URL de la imagen principal."""
    library = Library.objects.create(title='Hero image')

    with override_settings(MEDIA_ROOT=tmp_path):
        attachment = Attachment.objects.create(
            library=library,
            rank=0,
            original_name='hero.jpg',
            file=SimpleUploadedFile('hero.jpg', b'hero-image', content_type='image/jpeg'),
        )
        library.primary_attachment = attachment
        library.save(update_fields=['primary_attachment'])
        home = HomePage.load()
        home.hero_media = library
        home.save(update_fields=['hero_media'])

        response = api_client.get(reverse('home-page'))

    assert response.status_code == status.HTTP_200_OK
    assert response.data['hero_image_url'] == attachment.file.url
