"""Notification behavior for public lead submissions."""

import logging
from smtplib import SMTPRecipientsRefused

import pytest
from django.core import mail
from django.core.mail.backends.base import BaseEmailBackend
from django.test import override_settings
from django.urls import reverse
from rest_framework import status

from core_app.models import Lead

LOCMEM = 'django.core.mail.backends.locmem.EmailBackend'
LOCMEM_MAILERS = {'default': {'BACKEND': LOCMEM}}

PAYLOAD = {
    'full_name': 'Jane Doe',
    'email': 'jane@example.com',
    'phone': '+57 300 000 0000',
    'message': 'Me interesa: Luminux',
    'source': 'formulario-home',
}


@pytest.mark.django_db
@override_settings(
    LEADS_NOTIFICATION_EMAILS=['ventas@tenndalux.com'],
    MAILERS=LOCMEM_MAILERS,
)
def test_lead_create_notifies_the_configured_addresses(api_client):
    """Falla si una nueva consulta deja de notificar el correo configurado."""
    response = api_client.post(reverse('lead-list'), PAYLOAD, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    assert len(mail.outbox) == 1

    message = mail.outbox[0]
    assert message.to == ['ventas@tenndalux.com']
    assert 'Jane Doe' in message.subject
    assert 'Me interesa: Luminux' in message.body
    # Contestar la notificación le escribe a quien llenó el formulario.
    assert message.reply_to == ['jane@example.com']


@pytest.mark.django_db
@override_settings(
    LEADS_NOTIFICATION_EMAILS=['ventas@tenndalux.com', 'gerencia@tenndalux.com'],
    MAILERS=LOCMEM_MAILERS,
)
def test_lead_notification_reaches_every_configured_address(api_client):
    """Falla si una notificación deja de incluir algún destinatario configurado."""
    api_client.post(reverse('lead-list'), PAYLOAD, format='json')

    assert mail.outbox[0].to == ['ventas@tenndalux.com', 'gerencia@tenndalux.com']


@pytest.mark.django_db
@override_settings(LEADS_NOTIFICATION_EMAILS=[], MAILERS=LOCMEM_MAILERS)
def test_lead_is_stored_even_with_no_recipient_configured(api_client):
    """Estado por defecto hasta que el cliente entregue su correo."""
    response = api_client.post(reverse('lead-list'), PAYLOAD, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    assert Lead.objects.count() == 1
    assert mail.outbox == []


@pytest.mark.django_db
@override_settings(
    LEADS_NOTIFICATION_EMAILS=['ventas@tenndalux.com'],
    MAILERS={
        'default': {
            'BACKEND': 'core_app.tests.views.test_leads_notification.BrokenEmailBackend',
        },
    },
)
def test_lead_survives_a_broken_mail_server(api_client):
    """El lead ya está capturado: un SMTP caído no puede convertirlo en un 500."""
    response = api_client.post(reverse('lead-list'), PAYLOAD, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    assert Lead.objects.count() == 1


@pytest.mark.django_db
@override_settings(
    LEADS_NOTIFICATION_EMAILS=['ventas@tenndalux.com'],
    MAILERS={
        'default': {
            'BACKEND': 'core_app.tests.views.test_leads_notification.PrivateRecipientsBackend',
        },
    },
)
def test_lead_submission_persists_after_smtp_recipient_failure(api_client):
    """Falla si un rechazo SMTP convierte una consulta ya guardada en un error."""
    response = api_client.post(reverse('lead-list'), PAYLOAD, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    assert Lead.objects.count() == 1


@pytest.mark.django_db
@override_settings(
    LEADS_NOTIFICATION_EMAILS=['ventas@tenndalux.com'],
    MAILERS={
        'default': {
            'BACKEND': 'core_app.tests.views.test_leads_notification.PrivateRecipientsBackend',
        },
    },
)
def test_lead_notification_diagnostic_redacts_private_smtp_details(api_client, caplog):
    """Falla si el diagnóstico SMTP vuelve a incluir datos privados o traceback."""
    with caplog.at_level(logging.ERROR, logger='core_app.tasks'):
        api_client.post(reverse('lead-list'), PAYLOAD, format='json')

    assert 'SMTPRecipientsRefused' in caplog.text
    assert 'provider-private@example.invalid' not in caplog.text
    assert 'provider-private-marker' not in caplog.text
    assert PAYLOAD['email'] not in caplog.text
    assert PAYLOAD['message'] not in caplog.text
    assert 'Traceback' not in caplog.text


class BrokenEmailBackend(BaseEmailBackend):
    """Backend boundary that simulates a generic unavailable SMTP service."""

    def send_messages(self, email_messages):
        """Raise the delivery failure emitted by the unavailable provider."""
        raise OSError('smtp unreachable')


class PrivateRecipientsBackend(BaseEmailBackend):
    """Backend boundary that gives SMTP a private provider rejection payload."""

    def send_messages(self, email_messages):
        """Raise the privacy-sensitive SMTP exception exercised by the view."""
        raise SMTPRecipientsRefused(
            {'provider-private@example.invalid': (550, 'provider-private-marker')},
        )
