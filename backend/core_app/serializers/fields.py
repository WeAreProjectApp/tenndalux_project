from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models.manager import BaseManager
from rest_framework import serializers

from core_app.models import ContentImage
from core_app.utils.content_blocks import normalize_content_blocks, validate_content_blocks


class ContentBlocksListSerializer(serializers.ListSerializer):
    """Resuelve las imágenes de los bloques en una consulta por listado."""

    def to_representation(self, data):
        instances = list(data.all() if isinstance(data, BaseManager) else data)
        image_ids = set()
        for instance in instances:
            blocks = (
                instance.get('content_blocks', [])
                if isinstance(instance, dict)
                else getattr(instance, 'content_blocks', [])
            )
            image_ids.update(_gallery_image_ids(normalize_content_blocks(blocks)))

        self._content_images = {
            image.public_id: image
            for image in ContentImage.objects.filter(public_id__in=image_ids)
        } if image_ids else {}
        try:
            return super().to_representation(instances)
        finally:
            del self._content_images


class ContentBlocksField(serializers.JSONField):
    """
    Lista de bloques de contenido.

    Valida con la misma función que usa el admin, así una escritura por API no
    puede dejar guardado un JSON que el frontend no sabe pintar. Al leer resuelve
    el id de los videos de YouTube para no repetir esa expresión regular en
    TypeScript.
    """

    def to_internal_value(self, data):
        blocks = super().to_internal_value(data)
        try:
            validate_content_blocks(blocks)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        return blocks

    def to_representation(self, value):
        blocks = normalize_content_blocks(super().to_representation(value))
        list_serializer = getattr(self.parent, 'parent', None)
        found = getattr(list_serializer, '_content_images', None)
        return _resolve_gallery_images(blocks, found=found)


def _gallery_image_ids(blocks):
    return {
        image_id
        for block in blocks
        if block.get('type') == 'galeria'
        for image_id in block.get('images', [])
        if isinstance(image_id, str)
    }


def _resolve_gallery_images(blocks, found=None):
    """
    Cambia los ids de las galerías por la url y el alt de cada foto.

    Se guarda el id y no la url porque la url cambia si se reorganiza el
    almacenamiento, y porque quien escribe el JSON tiene el id a mano y no la
    ruta final del archivo.

    Un id que ya no existe (foto borrada, o mal tecleado) se omite en vez de
    llegar al frontend como una imagen rota: el resto de la galería se ve.
    """
    ids = _gallery_image_ids(blocks)
    if not ids:
        return blocks

    if found is None:
        found = {image.public_id: image for image in ContentImage.objects.filter(public_id__in=ids)}

    resolved = []
    for block in blocks:
        if block.get('type') != 'galeria':
            resolved.append(block)
            continue

        images = []
        for image_id in block.get('images', []):
            image = found.get(image_id)
            if image is not None:
                images.append({'id': image_id, 'url': image.image.url, 'alt': image.alt})

        resolved.append({**block, 'images': images})

    return resolved

def library_image_url(library):
    """
    URL de la imagen principal de una Library de django_attachments.

    `cover_image` es una Library, no un archivo: serializarla tal cual devuelve
    un id que al frontend no le sirve para nada. Se navega defensivamente
    porque una Library puede existir sin adjunto todavía.
    """
    attachment = getattr(library, 'primary_attachment', None)
    file = getattr(attachment, 'file', None)
    return file.url if file else None
