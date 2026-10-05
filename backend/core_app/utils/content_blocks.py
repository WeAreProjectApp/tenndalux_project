"""
Bloques de contenido de los posts del blog y los proyectos del portafolio.

El contenido no se carga campo por campo desde el admin: se pega un JSON con la
lista ordenada de bloques. **El orden del array es el orden en la página**, así
que reordenar secciones es mover elementos de la lista.

Cada tipo declara qué campos exige y cuáles acepta. Los campos de más se
rechazan a propósito: cuando el JSON lo genera una IA, un `texto` en vez de
`text` se guardaría en silencio y la sección saldría vacía en la web. Los
mensajes nombran el índice y el tipo del bloque para que el error sea
accionable desde el admin.
"""

import re

from django.core.exceptions import ValidationError


_YOUTUBE_ID = re.compile(
    r'(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|live/)|youtu\.be/)'
    r'(?P<id>[A-Za-z0-9_-]{11})'
)


def youtube_id(url):
    """Devuelve el id de 11 caracteres del video, o None si no es de YouTube."""
    if not isinstance(url, str):
        return None
    match = _YOUTUBE_ID.search(url)
    return match.group('id') if match else None


# --- Validadores de campo -------------------------------------------------
# Cada uno devuelve un mensaje de error, o None si el valor es correcto.

def _describe(text):
    """Cuelga del validador la descripción que verá quien redacte el JSON."""
    def decorator(fn):
        fn.description = text
        return fn
    return decorator


@_describe('texto')
def _texto(value):
    if not isinstance(value, str) or not value.strip():
        return 'debe ser un texto no vacío'
    return None


@_describe('lista de textos')
def _lista_de_textos(value):
    if not isinstance(value, list) or not value:
        return 'debe ser una lista con al menos un texto'
    if any(not isinstance(item, str) or not item.strip() for item in value):
        return 'debe contener solo textos no vacíos'
    return None


def _objetos(*campos, optional=()):
    esperado = ', '.join(campos)
    item_fields = {
        'required': {campo: _texto for campo in campos},
        'optional': {campo: _texto for campo in optional},
    }
    allowed_fields = set(item_fields['required']) | set(item_fields['optional'])

    def validar(value):
        if not isinstance(value, list) or not value:
            return f'debe ser una lista con al menos un objeto con {esperado}'
        errors = []
        for position, item in enumerate(value, start=1):
            if not isinstance(item, dict):
                errors.append(f'el elemento {position} debe ser un objeto con {esperado}')
                continue
            unknown_fields = sorted(set(item) - allowed_fields)
            if unknown_fields:
                errors.append(
                    f'el elemento {position}: campos no reconocidos: '
                    f'{", ".join(unknown_fields)}. '
                    f'Acepta: {", ".join(sorted(allowed_fields))}'
                )
            for group in ('required', 'optional'):
                for campo, validator in item_fields[group].items():
                    if campo not in item:
                        if group == 'required':
                            errors.append(f'al elemento {position} le falta el campo "{campo}"')
                        continue
                    problem = validator(item[campo])
                    if problem:
                        errors.append(f'el elemento {position}: "{campo}" {problem}')
        return '; '.join(errors) if errors else None

    validar.item_fields = item_fields
    validar.description = 'lista de objetos con textos no vacíos: ' + esperado + ' (obligatorios)'
    if optional:
        validar.description += '; ' + ', '.join(optional) + ' (opcionales)'
    return validar


@_describe('lista de ids de imagen (los que devuelve el cargador de fotos)')
def _ids_de_imagen(value):
    if not isinstance(value, list) or not value:
        return 'debe ser una lista con al menos un id de imagen subida'
    if any(not isinstance(item, str) or not item.strip() for item in value):
        return 'debe contener solo ids de imagen (los que devuelve el cargador de fotos)'
    return None


@_describe('enlace de YouTube')
def _url_youtube(value):
    if youtube_id(value) is None:
        return (
            'debe ser un enlace de YouTube '
            '(youtube.com/watch?v=…, youtu.be/… , /embed/… o /shorts/…)'
        )
    return None


# --- Catálogo de bloques --------------------------------------------------

BLOCK_TYPES = {
    'parrafo': {
        'description': 'Un párrafo de texto corrido. Es el bloque de base.',
        'required': {'text': _texto},
        'optional': {'heading': _texto},
    },
    'lista': {
        'description': 'Una lista de viñetas cortas.',
        'required': {'items': _lista_de_textos},
        'optional': {'heading': _texto},
    },
    'subsecciones': {
        'description': 'Varios sub-temas, cada uno con su título y su explicación.',
        'required': {'items': _objetos('title', 'description')},
        'optional': {'heading': _texto},
    },
    'linea_de_tiempo': {
        'description': 'Pasos en orden, para procesos o cronogramas.',
        'required': {'steps': _objetos('step', 'description', optional=('duration',))},
        'optional': {'heading': _texto},
    },
    'metricas': {
        'description': 'Cifras destacadas con su explicación (resultados, ahorros).',
        'required': {'items': _objetos('metric', 'description')},
        'optional': {'heading': _texto},
    },
    'galeria': {
        'description': 'Fotos ya subidas, referenciadas por su id.',
        'required': {'images': _ids_de_imagen},
        'optional': {'heading': _texto},
    },
    'video': {
        'description': 'Un video de YouTube embebido.',
        'required': {'youtube_url': _url_youtube},
        'optional': {'heading': _texto, 'title': _texto},
    },
    'ejemplos': {
        'description': (
            'Casos o ideas cortas, cada una en su tarjeta. Se ve distinto de «lista»: '
            'úsalo cuando cada punto es una idea completa y no una viñeta.'
        ),
        'required': {'items': _lista_de_textos},
        'optional': {'heading': _texto},
    },
    'cierre': {
        'description': (
            'El párrafo de cierre, en tarjeta destacada. Va al final y una sola vez. '
            '`note` es la invitación a contactarnos.'
        ),
        'required': {'text': _texto},
        'optional': {'note': _texto},
    },
    'testimonio': {
        'description': 'La cita de un cliente.',
        'required': {'text': _texto, 'author': _texto},
        'optional': {'heading': _texto, 'role': _texto},
    },
}


def validate_content_blocks(blocks):
    """
    Valida la lista completa y levanta ValidationError con TODOS los errores.

    Se acumulan a propósito en vez de cortar en el primero: quien pega un JSON
    de veinte bloques prefiere ver los tres problemas juntos y no descubrirlos
    de a uno guardando otras tantas veces.
    """
    if blocks in (None, ''):
        return

    if not isinstance(blocks, list):
        raise ValidationError('El contenido debe ser una lista de bloques (empieza con "[").')

    errores = []

    for index, block in enumerate(blocks):
        etiqueta = f'Bloque {index + 1}'

        if not isinstance(block, dict):
            errores.append(f'{etiqueta}: debe ser un objeto con al menos "type".')
            continue

        tipo = block.get('type')
        if not isinstance(tipo, str):
            errores.append(f'{etiqueta}: "type" debe ser un texto de la lista de tipos disponibles.')
            continue
        spec = BLOCK_TYPES.get(tipo)
        if spec is None:
            disponibles = ', '.join(sorted(BLOCK_TYPES))
            errores.append(
                f'{etiqueta}: tipo "{tipo}" desconocido. Disponibles: {disponibles}.'
            )
            continue

        etiqueta = f'{etiqueta} ({tipo})'
        permitidos = {'type', *spec['required'], *spec['optional']}
        sobran = sorted(set(block) - permitidos)
        if sobran:
            errores.append(
                f'{etiqueta}: campos no reconocidos: {", ".join(sobran)}. '
                f'Acepta: {", ".join(sorted(permitidos))}.'
            )

        for campo, validar in spec['required'].items():
            if campo not in block:
                errores.append(f'{etiqueta}: falta el campo "{campo}".')
                continue
            problema = validar(block[campo])
            if problema:
                errores.append(f'{etiqueta}: "{campo}" {problema}.')

        for campo, validar in spec['optional'].items():
            if campo not in block:
                continue
            problema = validar(block[campo])
            if problema:
                errores.append(f'{etiqueta}: "{campo}" {problema}.')

    if errores:
        raise ValidationError(errores)


def normalize_content_blocks(blocks):
    """
    Prepara los bloques para el frontend sin tocar lo que se guardó.

    Hoy sólo resuelve el id del video: extraer el id de la URL es la misma
    expresión regular que ya corre en la validación, y duplicarla en TypeScript
    sería mantener dos verdades sobre qué enlaces de YouTube son válidos.
    """
    if not isinstance(blocks, list):
        return []

    normalizados = []
    for block in blocks:
        if not isinstance(block, dict):
            continue
        if block.get('type') == 'video':
            block = {**block, 'youtube_id': youtube_id(block.get('youtube_url'))}
        normalizados.append(block)

    return normalizados


CONTENT_BLOCKS_HELP = (
    'Lista JSON de bloques. El orden del array es el orden en la página. '
    'Tipos: ' + ', '.join(sorted(BLOCK_TYPES)) + '. '
    'Las fotos se suben abajo y en el bloque "galeria" se referencian por su id.'
)


_KINDS = {
    'blog': {
        'brief': (
            'un artículo del blog de Tenndalux, una empresa de cortinas, persianas, '
            'automatización y control solar en Bogotá. Tono profesional y cercano, en '
            'español de Colombia, sin promesas de precios.'
        ),
        'length': 'Entre 8 y 14 bloques.',
        'outline': [
            'Abre con un `parrafo` que responda de entrada de qué trata el tema, sin rodeos.',
            'Desarrolla con `parrafo`, `lista` y `subsecciones`.',
            'Si explicas un proceso o unos pasos, usa `linea_de_tiempo`.',
            'Si tienes casos de uso o ideas sueltas, `ejemplos` los muestra en tarjetas.',
            'Cierra SIEMPRE con un bloque `cierre`, una sola vez y al final.',
        ],
        'typical': ['parrafo', 'lista', 'subsecciones', 'ejemplos', 'linea_de_tiempo', 'cierre'],
    },
    'portafolio': {
        'brief': (
            'la ficha de un proyecto realizado por Tenndalux, empresa de cortinas, '
            'persianas, automatización y control solar. En español de Colombia.'
        ),
        'length': 'Entre 6 y 10 bloques.',
        'outline': [
            'Empieza por el reto: un `parrafo` con el problema del espacio.',
            'Sigue con la solución aplicada, en `parrafo` o `subsecciones`.',
            'Si hubo etapas de obra, `linea_de_tiempo`.',
            'Los resultados medibles van en `metricas`.',
            'Si hay fotos o video del proyecto, `galeria` y `video`.',
            'Si el cliente dejó un comentario, `testimonio`.',
        ],
        'typical': ['parrafo', 'subsecciones', 'linea_de_tiempo', 'metricas', 'galeria', 'video', 'testimonio'],
    },
}


_EXAMPLE = [
    {'type': 'parrafo', 'heading': 'El reto', 'text': 'Un ventanal de piso a techo con sol directo toda la tarde.'},
    {'type': 'lista', 'heading': 'Lo que buscaba el cliente', 'items': ['Bajar el calor', 'No perder la vista']},
    {'type': 'subsecciones', 'heading': 'Opciones evaluadas', 'items': [
        {'title': 'Screen 5%', 'description': 'Filtra el sol y conserva la vista.'},
        {'title': 'Blackout', 'description': 'Oscuridad total, pierde la vista.'},
    ]},
    {'type': 'linea_de_tiempo', 'heading': 'Cómo fue el proceso', 'steps': [
        {'step': 'Visita técnica', 'description': 'Medición y análisis de luz.', 'duration': '1 día'},
        {'step': 'Instalación', 'description': 'Montaje y programación.', 'duration': '1 día'},
    ]},
    {'type': 'metricas', 'heading': 'Resultados', 'items': [
        {'metric': '-40%', 'description': 'Menos calor en la tarde.'},
    ]},
    {'type': 'video', 'youtube_url': 'https://youtu.be/dQw4w9WgXcQ', 'title': 'Recorrido del proyecto'},
    {'type': 'galeria', 'heading': 'Antes y después', 'images': ['img_a1b2c3d4', 'img_e5f6g7h8']},
    {'type': 'ejemplos', 'heading': 'Otros usos', 'items': [
        'Oficinas en casa con pantallas y reflejo.',
        'Habitaciones infantiles que necesitan oscuridad total.',
    ]},
    {'type': 'testimonio', 'text': 'Quedó impecable.', 'author': 'Ana Rodríguez', 'role': 'Propietaria'},
    {'type': 'cierre', 'text': 'Cada espacio pide una solución distinta.',
     'note': 'Escríbenos y lo revisamos contigo sin compromiso.'},
]


def _build_fields_schema(spec):
    fields = {}
    for group, required in (('required', True), ('optional', False)):
        for campo, validator in spec[group].items():
            field_schema = {'obligatorio': required, 'formato': validator.description}
            item_fields = getattr(validator, 'item_fields', None)
            if item_fields is not None:
                field_schema['campos'] = _build_fields_schema(item_fields)
            fields[campo] = field_schema
    return fields


def build_blocks_schema():
    """
    El catálogo en JSON, para que la IA lea la forma exacta y no la deduzca.

    Sale de BLOCK_TYPES igual que el texto: describir los bloques en prosa y en
    esquema por separado terminaría con los dos diciendo cosas distintas.
    """
    schema = {}

    for tipo, spec in sorted(BLOCK_TYPES.items()):
        campos = {'type': {'obligatorio': True, 'valor': tipo}}
        campos.update(_build_fields_schema(spec))

        schema[tipo] = {'descripcion': spec['description'], 'campos': campos}

    return schema


def build_blocks_schema_json():
    import json

    return json.dumps(build_blocks_schema(), ensure_ascii=False, indent=2)


def build_ai_instructions(kind, subject=None):
    """
    Arma el texto que se le entrega a una IA para que redacte el contenido.

    Se genera desde BLOCK_TYPES, no se escribe a mano: si mañana se agrega o se
    cambia un bloque, la plantilla queda al día sola. Una plantilla desfasada
    del validador produce JSON que la IA cree correcto y el admin rechaza.
    """
    import json

    perfil = _KINDS.get(kind, _KINDS['blog'])
    brief = perfil['brief']

    lines = [
        '# Cómo generar el contenido para Tenndalux',
        '',
        f'Vas a redactar {brief}',
        '',
    ]

    if subject:
        lines += [f'## Tema sobre el que debes trabajar', '', f'**{subject}**', '']

    lines += [
        '## Cómo estructurar este contenido',
        '',
        perfil['length'],
        '',
    ]
    lines += [f'- {paso}' for paso in perfil['outline']]
    lines += [
        '',
        'Los bloques que más se usan en este tipo de contenido: '
        + ', '.join(f'`{tipo}`' for tipo in perfil['typical'])
        + '. Los demás están disponibles si encajan.',
        '',
        '## Qué debes devolver',
        '',
        'ÚNICAMENTE un array JSON de bloques. Sin texto antes ni después, sin ```json,',
        'sin explicaciones. El array se pega tal cual en el administrador.',
        '',
        '**El orden del array es el orden en que aparecen las secciones en la página.**',
        '',
        '## Reglas que se validan y rechazan el contenido si no se cumplen',
        '',
        '- Cada bloque es un objeto con un campo `"type"` de la lista de abajo.',
        '- No inventes campos: los que no estén listados se rechazan. Cuidado con',
        '  escribir `texto` en vez de `text`, es el error más frecuente.',
        '- No inventes tipos de bloque nuevos.',
        '- Ningún texto puede ir vacío.',
        '',
        '## Bloques disponibles',
        '',
    ]

    for tipo in sorted(BLOCK_TYPES):
        spec = BLOCK_TYPES[tipo]
        lines.append(f'### `{tipo}`')
        lines.append('')
        lines.append(spec['description'])
        lines.append('')
        for campo, validador in spec['required'].items():
            lines.append(f'- `{campo}` (obligatorio) — {validador.description}')
        for campo, validador in spec['optional'].items():
            lines.append(f'- `{campo}` (opcional) — {validador.description}')
        lines.append('')

    lines += [
        '## Formato exacto de cada bloque (JSON)',
        '',
        'Esta es la misma definición que valida el administrador. Respétala al pie',
        'de la letra: `obligatorio: true` significa que sin ese campo el contenido',
        'se rechaza.',
        '',
        '```json',
        build_blocks_schema_json(),
        '```',
        '',
        '## Sobre los dos bloques especiales',
        '',
        '- **`video`**: sólo enlaces de YouTube. Si no tienes uno real, no incluyas el bloque.',
        '- **`galeria`**: las fotos NO se suben desde aquí. Quien publique las carga en el',
        '  administrador y obtiene un id por cada una (`img_…`). Si no te dieron esos ids,',
        '  omite el bloque `galeria` y quien publique lo agrega después.',
        '',
        f'## Ejemplo completo, usando los {len(BLOCK_TYPES)} bloques',
        '',
        '```json',
        json.dumps(_EXAMPLE, ensure_ascii=False, indent=2),
        '```',
        '',
    ]

    return '\n'.join(lines)


# Ritmo de lectura habitual en español para texto divulgativo.
_WORDS_PER_MINUTE = 200


def estimate_read_minutes(blocks):
    """
    Minutos de lectura, contados sobre el contenido real.

    Se calcula en vez de guardarse como campo para que no pueda quedar
    desactualizado: quien edita un post no va a acordarse de subir el número
    cuando le agregue tres párrafos.
    """
    if not isinstance(blocks, list):
        return 1

    words = 0
    for block in blocks:
        if not isinstance(block, dict):
            continue
        for value in block.values():
            if isinstance(value, str):
                words += len(value.split())
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str):
                        words += len(item.split())
                    elif isinstance(item, dict):
                        words += sum(
                            len(v.split()) for v in item.values() if isinstance(v, str)
                        )

    return max(1, round(words / _WORDS_PER_MINUTE))
