"""Untrusted CMS uploads must remain raster images on every attachment entry point."""

from io import BytesIO

import pytest
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django_attachments.models import Attachment, Library
from PIL import Image

from core_app.models import User


def _raster_upload(name='portrait.png', image_format='PNG'):
    source = BytesIO()
    Image.new('RGB', (16, 12), color='green').save(source, format=image_format)
    return SimpleUploadedFile(name, source.getvalue(), content_type='application/octet-stream')


def _html_upload():
    return SimpleUploadedFile('portrait.html', b'<script>window.uploadMarker=true</script>', content_type='image/png')


def _svg_upload():
    return SimpleUploadedFile(
        'portrait.svg',
        b'<svg xmlns="http://www.w3.org/2000/svg"><script>window.uploadMarker=true</script></svg>',
        content_type='image/png',
    )


def _png_html_upload():
    image = _raster_upload('portrait.html')
    return SimpleUploadedFile(
        image.name, image.read() + b'<script>window.uploadMarker=true</script>', content_type='image/png',
    )


@pytest.fixture(autouse=True)
def isolated_upload_storage(settings, tmp_path):
    """Keep original images and thumbnails away from any deploy media."""
    settings.MEDIA_ROOT = tmp_path / 'media'


@pytest.fixture
def attachment_editor(db):
    """Allow image management without granting superuser or user-management rights."""
    editor = User.objects.create_user(email='image-editor@example.test', is_staff=True)
    editor.user_permissions.add(*Permission.objects.filter(
        content_type__app_label='django_attachments',
        codename__in=('add_attachment', 'change_attachment', 'view_attachment', 'view_library'),
    ))
    return editor


@pytest.fixture
def library(db):
    return Library.objects.create(title='Existing image collection')


@pytest.fixture(params=['attachments_library_edit_api', 'attachments_gallery_edit_api'], ids=['library', 'gallery'])
def upload_url(request, library):
    return reverse(f'admin:{request.param}', args=[library.pk])


@pytest.fixture(params=[_html_upload, _svg_upload, _png_html_upload], ids=['html', 'svg', 'png-with-html-extension'])
def active_upload(request):
    return request.param()


def _admin_upload_data(library, upload):
    return {
        'library': library.pk,
        'file': upload,
        'rank': 0,
        'original_name': upload.name,
        'filesize': upload.size,
        'mimetype': 'image/png',
    }


@pytest.mark.django_db
def test_collection_upload_rejects_active_content(client, attachment_editor, library, upload_url, active_upload, settings):
    """Direct HTTP must reject executable file names despite image MIME claims."""
    client.force_login(attachment_editor)

    response = client.post(upload_url, {'action': 'upload', 'file': active_upload}, HTTP_ACCEPT='application/json')

    body = response.json()
    assert response.status_code == 200
    assert 'file' in body.get('errors', {}), body
    assert 'attachments' not in body
    assert Attachment.objects.count() == 0
    library.refresh_from_db()
    assert library.primary_attachment_id is None
    assert not settings.MEDIA_ROOT.exists()


@pytest.mark.django_db
def test_collection_upload_rejects_html_renamed_as_png(client, attachment_editor, library, upload_url, settings):
    """An allowed extension must not disguise HTML bytes as a stored image."""
    client.force_login(attachment_editor)
    upload = SimpleUploadedFile('portrait.png', b'<script>window.uploadMarker=true</script>', content_type='image/png')

    response = client.post(upload_url, {'action': 'upload', 'file': upload}, HTTP_ACCEPT='application/json')

    assert response.status_code == 200
    assert 'file' in response.json().get('errors', {})
    assert Attachment.objects.count() == 0
    library.refresh_from_db()
    assert library.primary_attachment_id is None
    assert not settings.MEDIA_ROOT.exists()


@pytest.mark.django_db
def test_collection_upload_rejects_unsupported_raster_format(client, attachment_editor, library, upload_url, settings):
    """A PNG name must not admit a decoded image format outside the raster policy."""
    client.force_login(attachment_editor)
    upload = _raster_upload('portrait.png', 'BMP')

    response = client.post(upload_url, {'action': 'upload', 'file': upload}, HTTP_ACCEPT='application/json')

    assert response.status_code == 200
    assert 'file' in response.json().get('errors', {})
    assert Attachment.objects.count() == 0
    library.refresh_from_db()
    assert library.primary_attachment_id is None
    assert not settings.MEDIA_ROOT.exists()


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('name', 'image_format'),
    [('portrait.jpg', 'JPEG'), ('portrait.jpeg', 'JPEG'), ('portrait.png', 'PNG'),
     ('portrait.webp', 'WEBP'), ('portrait.gif', 'GIF')],
    ids=['jpg', 'jpeg', 'png', 'webp', 'gif'],
)
def test_collection_upload_preserves_supported_image(client, attachment_editor, library, upload_url, name, image_format):
    """Supported raster uploads must retain their exact original bytes."""
    client.force_login(attachment_editor)
    upload = _raster_upload(name, image_format)
    expected_bytes = upload.read()
    upload.seek(0)

    response = client.post(upload_url, {'action': 'upload', 'file': upload}, HTTP_ACCEPT='application/json')

    attachment = Attachment.objects.get(library=library)
    assert response.status_code == 200
    assert response.json()['attachments'][0]['id'] == attachment.pk
    assert (attachment.image_width, attachment.image_height) == (16, 12)
    assert attachment.file.read() == expected_bytes
    library.refresh_from_db()
    assert library.primary_attachment_id == attachment.pk


@pytest.mark.django_db
def test_direct_attachment_admin_rejects_active_content(client, attachment_editor, library, active_upload, settings):
    """The direct Admin add form must not bypass the image upload boundary."""
    client.force_login(attachment_editor)

    response = client.post(reverse('admin:django_attachments_attachment_add'), _admin_upload_data(library, active_upload))

    assert response.status_code == 200
    assert 'file' in response.context['adminform'].form.errors
    assert Attachment.objects.count() == 0
    assert not settings.MEDIA_ROOT.exists()


@pytest.mark.django_db
def test_direct_attachment_admin_accepts_supported_image(client, attachment_editor, library):
    """Direct Admin image creation must remain available to content managers."""
    client.force_login(attachment_editor)
    upload = _raster_upload()
    expected_bytes = upload.read()
    upload.seek(0)

    response = client.post(reverse('admin:django_attachments_attachment_add'), _admin_upload_data(library, upload))

    assert response.status_code == 302
    assert Attachment.objects.get(library=library).file.read() == expected_bytes


@pytest.mark.django_db
def test_direct_attachment_admin_preserves_image_after_invalid_replacement(
    client, attachment_editor, library, active_upload, settings,
):
    """A rejected replacement must retain the saved original image and its metadata."""
    client.force_login(attachment_editor)
    original = _raster_upload()
    expected_bytes = original.read()
    original.seek(0)
    attachment = Attachment.objects.create(library=library, rank=0, file=original)
    original_path = attachment.file.name
    stored_paths = set(settings.MEDIA_ROOT.rglob('*'))

    response = client.post(
        reverse('admin:django_attachments_attachment_change', args=[attachment.pk]),
        _admin_upload_data(library, active_upload),
    )

    assert response.status_code == 200
    assert 'file' in response.context['adminform'].form.errors
    attachment.refresh_from_db()
    assert attachment.file.name == original_path
    assert attachment.original_name == 'portrait.png'
    assert attachment.file.read() == expected_bytes
    assert Attachment.objects.count() == 1
    assert set(settings.MEDIA_ROOT.rglob('*')) == stored_paths


@pytest.mark.django_db
def test_collection_upload_denies_staff_without_attachment_permission(client, library, upload_url, settings):
    """Staff membership must not grant image writes without the attachment permission."""
    viewer = User.objects.create_user(email='image-viewer@example.test', is_staff=True)
    client.force_login(viewer)

    response = client.post(upload_url, {'action': 'upload', 'file': _raster_upload()}, HTTP_ACCEPT='application/json')

    assert response.status_code == 403
    assert Attachment.objects.count() == 0
    library.refresh_from_db()
    assert library.primary_attachment_id is None
    assert not settings.MEDIA_ROOT.exists()
