"""The fixed product catalogue; only its presentation is editable by the client."""

from pathlib import Path
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models

from .base import TimestampedModel


def validate_product_image_size(value):
    if value.size > 5 * 1024 * 1024:
        raise ValidationError('La imagen debe pesar como máximo 5 MB.')


def product_image_path(instance, filename):
    return f'products/{uuid4().hex}{Path(filename).suffix.lower()}'


class Product(TimestampedModel):
    class Category(models.TextChoices):
        DESIGN_CURTAINS = 'cortinas-diseno', 'Cortinas de Diseño'
        PRACTICAL_SOLUTIONS = 'soluciones-practicas', 'Soluciones Prácticas'
        BLINDS = 'persianas', 'Persianas'
        OUTDOOR = 'exteriores', 'Exteriores'
        WALL_COVERINGS = 'recubrimientos', 'Recubrimientos'

    key = models.SlugField(max_length=80, unique=True, editable=False)
    name = models.CharField('Nombre', max_length=200)
    category = models.CharField('Categoría', max_length=30, choices=Category.choices)
    description = models.TextField('Descripción')
    image = models.ImageField(
        'Imagen', upload_to=product_image_path, blank=True,
        validators=[
            validate_product_image_size,
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp', 'gif']),
        ],
        help_text='JPG, PNG, WebP o GIF, hasta 5 MB. Sin reemplazo se usa la foto original.',
    )
    default_image = models.CharField(max_length=300, editable=False)
    order = models.PositiveIntegerField(default=0, editable=False)

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ('order', 'pk')

    def __str__(self):
        return self.name

    @property
    def image_url(self):
        return self.image.url if self.image else self.default_image
