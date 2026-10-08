"""Deleting an attachment must remove its real thumbnail with the configured storage."""

from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django_attachments.models import Attachment, Library
from easy_thumbnails.files import get_thumbnailer
from easy_thumbnails.storage import get_storage
from PIL import Image


@pytest.fixture(params=['default', 'custom'])
def uploaded_media(request, settings, tmp_path, db):
    """Create actual image files under isolated default or custom thumbnail storage."""
    settings.MEDIA_ROOT = tmp_path / 'media'
    (tmp_path / 'keep-parent.txt').write_text('fixture boundary')
    if request.param == 'custom':
        settings.STORAGES = {
            **settings.STORAGES,
            'easy_thumbnails': {
                'BACKEND': 'easy_thumbnails.storage.ThumbnailFileSystemStorage',
                'OPTIONS': {'location': str(tmp_path / 'thumbnails'), 'base_url': '/test-thumbnails/'},
            },
        }
    source = BytesIO()
    Image.new('RGB', (16, 16), color='green').save(source, format='PNG')
    library = Library.objects.create(title='Cleanup fixture')
    attachment = Attachment.objects.create(
        library=library, rank=0,
        file=SimpleUploadedFile('fixture.png', source.getvalue(), content_type='image/png'),
    )
    thumbnailer = get_thumbnailer(attachment.file)
    thumbnailer.thumbnail_storage = get_storage()
    thumbnail = thumbnailer.get_thumbnail({'size': (8, 8), 'crop': True})
    return attachment, attachment.file.name, attachment.file.storage, thumbnail.name, thumbnail.storage


@pytest.mark.django_db
def test_attachment_deletion_removes_stored_image(uploaded_media):
    """Real ORM deletion must complete and remove the original file."""
    attachment, original, source_storage, thumbnail, thumbnail_storage = uploaded_media
    pk = attachment.pk
    assert source_storage.exists(original)
    assert thumbnail_storage.exists(thumbnail)

    attachment.delete()

    assert not Attachment.objects.filter(pk=pk).exists()
    assert not source_storage.exists(original)


@pytest.mark.django_db
def test_attachment_deletion_removes_stored_thumbnail(uploaded_media):
    """Cleanup must find the same storage that holds the generated thumbnail."""
    attachment, original, source_storage, thumbnail, thumbnail_storage = uploaded_media
    assert source_storage.exists(original)
    assert thumbnail_storage.exists(thumbnail)

    attachment.delete()

    assert not thumbnail_storage.exists(thumbnail)
