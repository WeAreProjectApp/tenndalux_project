"""Public warranty documents managed through Django Admin."""

from pathlib import Path
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.db import models

from .base import TimestampedModel

MAX_PDF_BYTES = 5 * 1024 * 1024


def validate_warranty_pdf(value):
    """Check uploaded bytes without consuming the file used by storage."""
    if Path(value.name).suffix.lower() != '.pdf':
        raise ValidationError('Seleccione un archivo PDF.')
    if value.size > MAX_PDF_BYTES:
        raise ValidationError('El PDF debe pesar como máximo 5 MB.')
    position = value.tell()
    try:
        value.seek(0)
        if value.read(5) != b'%PDF-':
            raise ValidationError('El archivo no contiene un PDF válido.')
    finally:
        value.seek(position)


def warranty_upload_path(instance, filename):
    return f'warranties/{uuid4().hex}.pdf'


class WarrantyDocument(TimestampedModel):
    title = models.CharField('Título', max_length=200)
    document = models.FileField(
        'Documento PDF',
        upload_to=warranty_upload_path,
        validators=[validate_warranty_pdf],
        help_text='PDF de hasta 5 MB. Los documentos publicados son públicos.',
    )
    order = models.PositiveIntegerField('Orden', default=0)
    is_published = models.BooleanField('Publicado', default=False)

    class Meta:
        verbose_name = 'Documento de garantía'
        verbose_name_plural = 'Documentos de garantía'
        ordering = ('order', 'title', 'pk')

    def __str__(self):
        return self.title
