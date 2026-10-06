"""
Frontend views that serve Next.js static export HTML templates.

These views read the pre-built HTML files from templates/frontend/
and return them as HttpResponse to avoid Django template engine
processing (which could conflict with Next.js inline JS containing
curly braces).
"""

import html as html_module
import re
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse, Http404

from core_app.models import Post, Project

TEMPLATES_DIR = settings.BASE_DIR / 'templates' / 'frontend'


def _serve_html(template_path: str):
    """Read an HTML file and return it as HttpResponse."""
    file_path = TEMPLATES_DIR / template_path
    if file_path.exists():
        return HttpResponse(
            file_path.read_text(encoding='utf-8'),
            content_type='text/html; charset=utf-8',
        )
    raise Http404


# El shell es la plantilla única que sirve a TODOS los slugs de blog y
# portafolio. Se genera una vez en el build y el contenido lo pide el navegador
# a la API, así que publicar desde el admin no exige un despliegue.
SHELL_SLUG = '_shell'

_TITLE = re.compile(r'<title>.*?</title>', re.IGNORECASE | re.DOTALL)
_DESCRIPTION = re.compile(
    r'<meta\s+name=["\']description["\'][^>]*>', re.IGNORECASE
)


def _serve_shell(template_path: str, *, title: str, description: str, status: int = 200):
    """
    Sirve el shell con las metas del contenido ya escritas en el HTML.

    Sin esto la página seguiría funcionando —el navegador rellena todo— pero un
    buscador o el previsualizador de WhatsApp leen el HTML inicial y verían el
    mismo título genérico en todos los artículos.
    """
    file_path = TEMPLATES_DIR / template_path
    if not file_path.exists():
        raise Http404

    markup = file_path.read_text(encoding='utf-8')
    safe_title = html_module.escape(title)
    safe_description = html_module.escape(description)

    markup = _TITLE.sub(f'<title>{safe_title}</title>', markup, count=1)
    meta = f'<meta name="description" content="{safe_description}">'
    markup, replaced = _DESCRIPTION.subn(meta, markup, count=1)

    social = (
        f'<meta property="og:title" content="{safe_title}">'
        f'<meta property="og:description" content="{safe_description}">'
        f'<meta property="og:type" content="article">'
    )
    if not replaced:
        social = meta + social
    markup = markup.replace('</head>', social + '</head>', 1)

    return HttpResponse(markup, content_type='text/html; charset=utf-8', status=status)


def home(request):
    return _serve_html('index.html')


def productos(request):
    return _serve_html('productos/index.html')


def servicios(request):
    return _serve_html('servicios/index.html')


def garantias(request):
    return _serve_html('garantias/index.html')


def portafolio(request):
    return _serve_html('portafolio/index.html')


def portafolio_detail(request, slug):
    project = Project.objects.filter(slug=slug, is_published=True).first()

    # Un slug inexistente devuelve 404 —lo correcto para un buscador— pero con
    # el shell dentro, para que el visitante vea la página de "no encontramos
    # este proyecto" del sitio y no la de Django.
    if project is None:
        return _serve_shell(
            f'portafolio/{SHELL_SLUG}/index.html',
            title='Proyecto no encontrado — Tenndalux',
            description='Este proyecto no está disponible.',
            status=404,
        )

    return _serve_shell(
        f'portafolio/{SHELL_SLUG}/index.html',
        title=f'{project.title} — Tenndalux',
        description=project.description[:200],
    )


def blog(request):
    return _serve_html('blog/index.html')


def blog_detail(request, slug):
    post = Post.objects.filter(slug=slug, is_published=True).first()

    if post is None:
        return _serve_shell(
            f'blog/{SHELL_SLUG}/index.html',
            title='Artículo no encontrado — Tenndalux',
            description='Este artículo no está disponible.',
            status=404,
        )

    return _serve_shell(
        f'blog/{SHELL_SLUG}/index.html',
        title=post.meta_title or f'{post.title} — Tenndalux',
        description=post.meta_description or post.excerpt[:200],
    )


def auth_login(request):
    return _serve_html('auth/login/index.html')


def auth_register(request):
    return _serve_html('auth/register/index.html')


def dashboard(request):
    return _serve_html('dashboard/index.html')


def not_found(request, exception=None):
    """Custom 404 handler."""
    file_path = TEMPLATES_DIR / '404.html'
    if file_path.exists():
        return HttpResponse(
            file_path.read_text(encoding='utf-8'),
            content_type='text/html; charset=utf-8',
            status=404,
        )
    return HttpResponse('<h1>404 - Page Not Found</h1>', status=404)
