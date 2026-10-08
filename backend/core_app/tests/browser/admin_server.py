"""Explicit pytest target for the Playwright Admin worker (not a suite test)."""

import json
import os
import sys
from pathlib import Path

import pytest


@pytest.fixture(scope='session')
def django_db_modify_db_settings():
    from django.conf import settings
    from huey import MemoryHuey

    root = Path(os.environ['E2E_ADMIN_ROOT'])
    settings.DATABASES['default'].setdefault('TEST', {})['NAME'] = str(root / 'test.sqlite3')
    settings.MEDIA_ROOT = root / 'media'
    settings.MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    settings.DEBUG = True
    settings.MAILERS = {'default': {'BACKEND': 'django.core.mail.backends.locmem.EmailBackend'}}
    settings.HUEY = MemoryHuey('t33-admin-fixture', immediate=True)


def test_admin_server(live_server, transactional_db):
    from django.contrib.auth.models import Permission
    from core_app.models import HomePage, User

    user = User.objects.create_user(
        email='t33-admin@example.test', password='t33-fixture-only-password',
        role=User.ROLE_ADMIN, is_staff=True,
    )
    user.user_permissions.set(Permission.objects.filter(
        content_type__app_label__in=['core_app', 'django_attachments'],
        content_type__model__in=['homepage', 'warrantydocument', 'library', 'attachment'],
    ))
    home = HomePage.load()
    home.hero_title = 'Portada original de fixture'
    home.save()
    print('E2E_ADMIN_READY=' + json.dumps({
        'url': live_server.url,
        'email': user.email,
        'password': 't33-fixture-only-password',
        'homeId': home.pk,
    }), flush=True)
    # The Node worker owns lifetime; EOF also shuts down on runner exit.
    sys.stdin.readline()
