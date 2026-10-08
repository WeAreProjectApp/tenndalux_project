"""CMS metadata must remain literal text in the real HTTP shell response."""

import pytest
from django.test import Client

from core_app.models import Post, Project
from core_app.views import frontend_views

BODY = '<body><p>Shell content</p><script>window.shellLoaded=true;</script></body>'


@pytest.fixture
def metadata_client(tmp_path, monkeypatch):
    """Serve temporary export HTML through the ordinary Django URL handlers."""
    for section in ('blog', 'portafolio'):
        shell = tmp_path / section / '_shell'
        shell.mkdir(parents=True)
        (shell / 'index.html').write_text(
            '<html><head><title>Generic</title>'
            '<meta name="description" content="generic"></head>' + BODY + '</html>',
            encoding='utf-8',
        )
    monkeypatch.setattr(frontend_views, 'TEMPLATES_DIR', tmp_path)
    return Client(raise_request_exception=False)


@pytest.mark.django_db
def test_blog_title_preserves_literal_back_reference(metadata_client):
    """A title containing a regex-looking token must be returned with HTTP 200."""
    Post.objects.create(
        title='Article', slug='literal-title', meta_title=r'Título literal \1', is_published=True,
    )

    response = metadata_client.get('/blog/literal-title/')

    assert response.status_code == 200
    markup = response.content.decode()
    assert r'<title>Título literal \1</title>' in markup
    assert r'<meta property="og:title" content="Título literal \1">' in markup
    assert BODY in markup


@pytest.mark.django_db
def test_blog_description_preserves_literal_back_reference(metadata_client):
    """Description replacement must not interpret the CMS value as a regex template."""
    Post.objects.create(
        title='Article', slug='literal-description', meta_description=r'Descripción literal \1',
        is_published=True,
    )

    response = metadata_client.get('/blog/literal-description/')

    assert response.status_code == 200
    markup = response.content.decode()
    assert r'<meta name="description" content="Descripción literal \1">' in markup
    assert r'<meta property="og:description" content="Descripción literal \1">' in markup


@pytest.mark.django_db
def test_portfolio_title_preserves_literal_back_reference(metadata_client):
    """The project title must retain its literal slash token and brand suffix."""
    Project.objects.create(title=r'Proyecto \2', slug='literal-project', is_published=True)

    response = metadata_client.get('/portafolio/literal-project/')

    assert response.status_code == 200
    markup = response.content.decode()
    assert r'<title>Proyecto \2 — Tenndalux</title>' in markup
    assert r'<meta property="og:title" content="Proyecto \2 — Tenndalux">' in markup


@pytest.mark.django_db
def test_portfolio_description_keeps_slashes_as_text(metadata_client):
    """Backslashes must not turn a path into newline or form-feed characters."""
    Project.objects.create(
        title='Project', slug='literal-path', description=r'Windows C:\new\folder',
        is_published=True,
    )

    response = metadata_client.get('/portafolio/literal-path/')

    assert response.status_code == 200
    markup = response.content.decode()
    assert r'<meta name="description" content="Windows C:\new\folder">' in markup
    assert r'<meta property="og:description" content="Windows C:\new\folder">' in markup


@pytest.mark.django_db
def test_literal_metadata_is_html_escaped(metadata_client):
    """The literal replacement must keep CMS markup out of executable HTML."""
    Post.objects.create(
        title='Article', slug='escaped-metadata',
        meta_title='CMS <script>alert(1)</script> & "foto"',
        meta_description='" onerror="alert(1)"><img src=x> &', is_published=True,
    )

    response = metadata_client.get('/blog/escaped-metadata/')

    assert response.status_code == 200
    markup = response.content.decode()
    assert '<title>CMS &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;foto&quot;</title>' in markup
    assert '<meta name="description" content="&quot; onerror=&quot;alert(1)&quot;&gt;&lt;img src=x&gt; &amp;">' in markup
    assert '<script>alert(1)</script>' not in markup
    assert '<img src=x>' not in markup
    assert BODY in markup
