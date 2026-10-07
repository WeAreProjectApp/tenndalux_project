"""Contracts for staging the Next static export into Django assets."""

import os
import shutil
import stat
import subprocess
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
FRONTEND_SOURCE = REPOSITORY_ROOT / 'frontend'


def _export_script_copy(tmp_path):
    frontend = tmp_path / 'frontend'
    scripts = frontend / 'scripts'
    scripts.mkdir(parents=True)
    shutil.copy2(FRONTEND_SOURCE / 'build_to_django.sh', frontend / 'build_to_django.sh')
    shutil.copy2(
        FRONTEND_SOURCE / 'scripts' / 'copy-static-export-payloads.sh',
        scripts / 'copy-static-export-payloads.sh',
    )
    return frontend


def _fake_npx(tmp_path):
    executable = tmp_path / 'bin' / 'npx'
    executable.parent.mkdir()
    executable.write_text('#!/usr/bin/env sh\nexit 0\n')
    executable.chmod(executable.stat().st_mode | stat.S_IXUSR)
    return executable.parent


def _run_export_script(frontend, executable_dir, monkeypatch):
    monkeypatch.setenv('PATH', f'{executable_dir}{os.pathsep}{os.environ["PATH"]}')
    return subprocess.run(
        ['bash', str(frontend / 'build_to_django.sh')],
        cwd=frontend,
        check=False,
        capture_output=True,
        text=True,
    )


def test_build_export_copies_root_webp_asset_to_django_static(tmp_path, monkeypatch):
    """Falla si el logo WebP generado por Next no llega al directorio estático de Django."""
    frontend = _export_script_copy(tmp_path)
    out = frontend / 'out'
    (out / '_next').mkdir(parents=True)
    (out / '_next' / 'chunk.js').write_text('chunk')
    (out / 'index.html').write_text('<main>Tenndalux</main>')
    (out / 'index.txt').write_text('root payload')
    logo_bytes = b'RIFF-webp-logo'
    (out / 'logo-tenndalux.webp').write_bytes(logo_bytes)

    result = _run_export_script(frontend, _fake_npx(tmp_path), monkeypatch)

    assert result.returncode == 0
    assert (tmp_path / 'backend' / 'static' / 'logo-tenndalux.webp').read_bytes() == logo_bytes


def test_build_export_keeps_existing_root_assets(tmp_path, monkeypatch):
    """Falla si incluir WebP deja de publicar los assets raíz ya soportados."""
    frontend = _export_script_copy(tmp_path)
    out = frontend / 'out'
    (out / '_next').mkdir(parents=True)
    (out / '_next' / 'chunk.js').write_text('chunk')
    (out / 'icon.svg').write_bytes(b'<svg/>')
    (out / 'favicon.ico').write_bytes(b'icon')
    (out / 'share.png').write_bytes(b'png')
    (out / 'robots.txt').write_bytes(b'robots')
    (out / 'index.txt').write_text('root payload')

    result = _run_export_script(frontend, _fake_npx(tmp_path), monkeypatch)

    static_directory = tmp_path / 'backend' / 'static'
    assert result.returncode == 0
    assert {
        path.name: path.read_bytes()
        for path in static_directory.iterdir()
        if path.is_file()
    } == {
        'icon.svg': b'<svg/>',
        'favicon.ico': b'icon',
        'share.png': b'png',
        'robots.txt': b'robots',
        'index.txt': b'root payload',
    }


def test_build_export_copies_root_html_template(tmp_path, monkeypatch):
    """Falla si el HTML raíz exportado deja de llegar a las plantillas de Django."""
    frontend = _export_script_copy(tmp_path)
    out = frontend / 'out'
    (out / '_next').mkdir(parents=True)
    (out / '_next' / 'chunk.js').write_text('chunk')
    (out / 'index.html').write_text('<main>Tenndalux</main>')
    (out / 'index.txt').write_text('root payload')

    result = _run_export_script(frontend, _fake_npx(tmp_path), monkeypatch)

    assert result.returncode == 0
    assert (tmp_path / 'backend' / 'templates' / 'frontend' / 'index.html').read_text() == (
        '<main>Tenndalux</main>'
    )
