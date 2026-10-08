"""
Endpoints que usa el editor de bloques del admin de Django.

Van fuera de `/api/` porque no son parte de la API pública: los protege la
sesión del admin, no un JWT.
"""

import io
import json
import zipfile

from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django_attachments.forms import RasterImageField

from core_app.models import ContentImage
from core_app.utils.content_blocks import (
    build_ai_instructions,
    build_blocks_schema_json,
    validate_content_blocks,
)


# El navegador comprime cada foto por debajo de 1 MB antes de enviarla. Este
# techo es el margen para que un fallo de compresión se rechace acá y no llegue
# al límite de 10 MB de nginx con un mensaje que nadie entiende.
MAX_UPLOAD_BYTES = 2 * 1024 * 1024


@staff_member_required
@require_GET
def content_blocks_instructions(request):
    """Las instrucciones para pegarle a una IA, en texto plano o como descarga."""
    kind = request.GET.get('kind', 'blog')
    subject = (request.GET.get('subject') or '').strip() or None
    text = build_ai_instructions(kind, subject)

    if request.GET.get('download'):
        # Se descargan juntos: el .md se lee, y el .json se le adjunta a la IA
        # como definición del formato. Por separado es fácil mandar sólo uno.
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
            archive.writestr(f'instrucciones-{kind}.md', text)
            archive.writestr('formato-bloques.json', build_blocks_schema_json())

        response = HttpResponse(buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="instrucciones-{kind}.zip"'
        return response

    return HttpResponse(text, content_type='text/plain; charset=utf-8')


@staff_member_required
@require_POST
def upload_content_image(request):
    """Recibe UNA foto y devuelve su id, para referenciarla en un bloque «galeria»."""
    upload = request.FILES.get('image')
    if upload is None:
        return JsonResponse({'error': 'No se recibió ninguna imagen.'}, status=400)

    if upload.size > MAX_UPLOAD_BYTES:
        peso = upload.size / (1024 * 1024)
        return JsonResponse(
            {'error': f'La imagen pesa {peso:.1f} MB y el máximo es 2 MB. Vuelve a intentarlo.'},
            status=400,
        )

    # Verify image bytes and the final suffix using the same boundary as the
    # attachment admin. A real PNG named .html must not be served as active HTML.
    try:
        upload = RasterImageField().clean(upload)
    except ValidationError as exc:
        return JsonResponse({'error': ' '.join(exc.messages)}, status=400)

    image = ContentImage(image=upload, alt=(request.POST.get('alt') or '')[:200])
    try:
        image.full_clean()
    except ValidationError as exc:
        return JsonResponse({'error': ' '.join(exc.messages)}, status=400)

    image.save()
    return JsonResponse({
        'public_id': image.public_id,
        'url': image.image.url,
        'name': upload.name,
    })


@staff_member_required
@require_POST
def validate_blocks(request):
    """Valida el JSON sin guardar, para revisarlo antes de mandar el formulario."""
    try:
        blocks = json.loads(request.body or b'[]')
    except json.JSONDecodeError as exc:
        return JsonResponse({'ok': False, 'errors': [f'El JSON no es válido: {exc}']})

    try:
        validate_content_blocks(blocks)
    except ValidationError as exc:
        return JsonResponse({'ok': False, 'errors': exc.messages})

    count = len(blocks) if isinstance(blocks, list) else 0
    return JsonResponse({'ok': True, 'count': count})
