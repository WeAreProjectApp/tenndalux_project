"""Contract tests for stored content blocks and their public serializer surface."""

import pytest
from core_app.models import Post, Project
from core_app.serializers import PostSerializer, ProjectSerializer
from core_app.utils.content_blocks import BLOCK_TYPES, validate_content_blocks
from django.core.exceptions import ValidationError

VALID_DOCUMENT = [
    {'type': 'parrafo', 'heading': '¿Qué son?', 'text': 'Sistemas motorizados.'},
    {'type': 'lista', 'items': ['Control de luz', 'Privacidad']},
    {'type': 'subsecciones', 'items': [{'title': 'Básico', 'description': 'Un motor.'}]},
    {'type': 'linea_de_tiempo',
     'steps': [{'step': 'Medición', 'description': 'Visita técnica.', 'duration': '1 día'}]},
    {'type': 'metricas', 'items': [{'metric': '-40%', 'description': 'Menos calor.'}]},
    {'type': 'galeria', 'images': ['img_a1b2c3']},
    {'type': 'video', 'youtube_url': 'https://youtu.be/dQw4w9WgXcQ'},
    {'type': 'ejemplos', 'items': ['Oficinas en casa con reflejo en pantallas.']},
    {'type': 'testimonio', 'text': 'Impecable.', 'author': 'Ana', 'role': 'Cliente'},
    {'type': 'cierre', 'text': 'Cada espacio es distinto.', 'note': 'Escríbenos.'},
]


def _errors(blocks):
    with pytest.raises(ValidationError) as raised:
        validate_content_blocks(blocks)
    return raised.value.messages


def test_a_document_using_every_block_type_is_accepted():
    """Falla si el catálogo añade un tipo que el documento de referencia no demuestra válido."""
    # Ata el documento al catálogo: al agregar un bloque, este test falla hasta
    # que se demuestre que también se acepta.
    assert {block['type'] for block in VALID_DOCUMENT} == set(BLOCK_TYPES)
    assert validate_content_blocks(VALID_DOCUMENT) is None


def test_an_empty_document_is_accepted():
    """Un post recién creado no tiene bloques todavía."""
    assert validate_content_blocks([]) is None


def test_the_document_must_be_a_list():
    """Falla si una estructura que no es array deja de rechazarse antes de guardar."""
    assert 'lista de bloques' in _errors({'type': 'parrafo', 'text': 'x'})[0]


def test_an_unknown_type_names_the_available_ones():
    """Falla si un tipo inventado deja de mostrar el catálogo que permite corregirlo."""
    message = _errors([{'type': 'carrusel'}])[0]

    assert 'carrusel' in message
    assert 'galeria' in message
    assert 'testimonio' in message


def test_a_missing_required_field_points_at_the_block():
    """Falla si un campo obligatorio ausente deja de identificar el bloque que lo necesita."""
    assert _errors([{'type': 'parrafo'}]) == ['Bloque 1 (parrafo): falta el campo "text".']


@pytest.mark.parametrize(
    ('block', 'nested_field'),
    [
        ({'type': 'subsecciones', 'items': [{'title': {}, 'description': 'Texto'}]}, 'title'),
        ({'type': 'subsecciones', 'items': [{'title': 'Título', 'description': []}]}, 'description'),
        ({'type': 'linea_de_tiempo', 'steps': [{'step': None, 'description': 'Texto'}]}, 'step'),
        ({'type': 'linea_de_tiempo', 'steps': [{'step': 'Paso', 'description': True}]}, 'description'),
        ({'type': 'metricas', 'items': [{'metric': 40, 'description': 'Texto'}]}, 'metric'),
        ({'type': 'metricas', 'items': [{'metric': '40%', 'description': '  '}]}, 'description'),
    ],
)
def test_nested_content_requires_nonempty_text(block, nested_field):
    """Falla si los bloques anidados vuelven a aceptar valores que React no puede renderizar."""
    message = _errors([block])[0]

    assert 'Bloque 1' in message
    assert f'"{nested_field}" debe ser un texto no vacío' in message


@pytest.mark.parametrize(
    'step',
    [
        {'step': 'Medición', 'description': 'Visitamos el espacio.'},
        {'step': 'Medición', 'description': 'Visitamos el espacio.', 'duration': '2 días'},
    ],
)
def test_timeline_accepts_optional_duration_values(step):
    """Falla si el tiempo opcional se vuelve obligatorio o deja de aceptar texto."""
    assert validate_content_blocks([{'type': 'linea_de_tiempo', 'steps': [step]}]) is None


@pytest.mark.parametrize('duration', ['', 1])
def test_timeline_rejects_an_invalid_duration(duration):
    """Falla si la duración opcional acepta un valor vacío o incompatible."""
    message = _errors([{
        'type': 'linea_de_tiempo',
        'steps': [{'step': 'Medición', 'description': 'Visitamos el espacio.', 'duration': duration}],
    }])[0]

    assert '"duration" debe ser un texto no vacío' in message


def test_content_validation_reports_document_errors_together():
    """Falla si un JSON defectuoso deja de informar todos sus problemas en una sola respuesta."""
    errors = _errors([
        {'type': []},
        {'type': {}},
        {'type': 'subsecciones', 'items': [{'title': 'Título', 'description': 'Texto', 'copy': 'extra'}]},
    ])

    assert len(errors) == 3
    assert errors[0] == 'Bloque 1: "type" debe ser un texto de la lista de tipos disponibles.'
    assert errors[1] == 'Bloque 2: "type" debe ser un texto de la lista de tipos disponibles.'
    assert 'Bloque 3 (subsecciones): "items" el elemento 1: campos no reconocidos: copy' in errors[2]


def test_a_misspelled_field_is_rejected_rather_than_silently_dropped():
    """El caso típico del JSON generado por IA: `texto` en vez de `text`."""
    message = _errors([{'type': 'parrafo', 'texto': 'Hola'}])

    assert any('no reconocidos: texto' in error for error in message)
    assert any('falta el campo "text"' in error for error in message)


def test_every_problem_is_reported_at_once():
    """Falla si la validación deja de devolver todos los errores de un documento en una pasada."""
    errors = _errors([{'type': 'parrafo'}, {'type': 'lista', 'items': []}, {'type': 'nope'}])

    assert len(errors) == 3
    assert errors[0].startswith('Bloque 1')
    assert errors[2].startswith('Bloque 3')


def test_a_video_that_is_not_youtube_is_rejected():
    """Falla si una URL de video ajena a YouTube se acepta como bloque embebible."""
    assert 'YouTube' in _errors([{'type': 'video', 'youtube_url': 'https://vimeo.com/1'}])[0]


def test_an_empty_gallery_is_rejected():
    """Falla si una galería sin identificadores vuelve a llegar al frontend sin imágenes."""
    assert 'id de imagen' in _errors([{'type': 'galeria', 'images': []}])[0]


@pytest.mark.django_db
def test_reading_a_post_resolves_the_youtube_id_for_the_frontend():
    """Falla si la respuesta de lectura deja de exponer el identificador que consume el reproductor."""
    post = Post.objects.create(title='Guía', content_blocks=[
        {'type': 'video', 'youtube_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30'},
    ])

    block = PostSerializer(post).data['content_blocks'][0]

    assert block['youtube_id'] == 'dQw4w9WgXcQ'
    # Lo que se guardó no se toca: el admin sigue viendo lo que se pegó.
    assert block['youtube_url'] == 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30'


@pytest.mark.django_db
def test_the_api_refuses_to_store_blocks_the_frontend_cannot_render():
    """Falla si la escritura API permite un bloque al que le falta un campo obligatorio."""
    serializer = PostSerializer(data={'title': 'Guía', 'content_blocks': [{'type': 'parrafo'}]})

    assert not serializer.is_valid()
    assert 'content_blocks' in serializer.errors


@pytest.mark.django_db
@pytest.mark.parametrize('serializer_class', [PostSerializer, ProjectSerializer])
def test_api_serializers_expose_nested_content_block_errors(serializer_class):
    """Falla si una escritura API vuelve a guardar un campo anidado inválido."""
    serializer = serializer_class(data={
        'title': 'Guía anidada',
        'content_blocks': [{'type': 'metricas', 'items': [{'metric': '40%', 'description': False}]}],
    })

    assert not serializer.is_valid()
    assert 'content_blocks' in serializer.errors


@pytest.mark.django_db
@pytest.mark.parametrize('model_class', [Post, Project])
def test_models_expose_nested_content_block_errors(model_class):
    """Falla si el formulario de administración deja de rechazar un bloque anidado inválido."""
    instance = model_class(
        title='Guía anidada',
        content_blocks=[{'type': 'subsecciones', 'items': [{'title': 'Título', 'description': None}]}],
    )

    with pytest.raises(ValidationError) as raised:
        instance.full_clean()

    assert 'content_blocks' in raised.value.message_dict


@pytest.mark.django_db
def test_the_admin_validates_through_the_model():
    """Falla si la limpieza del modelo deja de ejecutar el contrato común de bloques."""
    post = Post(title='Guía', content_blocks=[{'type': 'video', 'youtube_url': 'no'}])

    with pytest.raises(ValidationError) as raised:
        post.full_clean()

    assert 'content_blocks' in raised.value.message_dict


@pytest.mark.django_db
def test_read_time_is_computed_from_the_content_and_not_stored():
    """Un campo editable quedaría viejo en cuanto alguien agregue párrafos."""
    corto = Post.objects.create(title='Corto', content_blocks=[
        {'type': 'parrafo', 'text': 'Dos palabras'},
    ])
    largo = Post.objects.create(title='Largo', content_blocks=[
        {'type': 'parrafo', 'text': 'palabra ' * 1200},
    ])

    assert PostSerializer(corto).data['read_time_minutes'] == 1
    assert PostSerializer(largo).data['read_time_minutes'] == 6


@pytest.mark.django_db
def test_read_time_counts_the_text_nested_inside_blocks():
    """Listas y subsecciones son la mayor parte de un artículo largo."""
    post = Post.objects.create(title='Anidado', content_blocks=[
        {'type': 'subsecciones', 'items': [
            {'title': 'Uno', 'description': 'palabra ' * 400},
            {'title': 'Dos', 'description': 'palabra ' * 400},
        ]},
    ])

    assert PostSerializer(post).data['read_time_minutes'] == 4
