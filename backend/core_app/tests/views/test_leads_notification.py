"""Notification behavior for public lead submissions."""

import logging
from smtplib import SMTPRecipientsRefused
from unittest.mock import patch

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
    LEADS_NOTIFICATION_EMAILS=['ventas@tenndalux.com'],
    MAILERS=LOCMEM_MAILERS,
)
@pytest.mark.parametrize(
    ('field', 'value', 'expected_fragment'),
    [
        ('city', 'Bogotá, Chapinero', 'Ubicación del proyecto: Bogotá, Chapinero'),
        ('spaces_count', 3, 'Cantidad de espacios: 3'),
    ],
    ids=('location', 'space-count'),
)
def test_lead_notification_includes_each_project_detail(
    api_client, field, value, expected_fragment,
):
    """Falla si el aviso omite un dato nuevo pedido a quien consulta."""
    response = api_client.post(
        reverse('lead-list'),
        {**PAYLOAD, field: value},
        format='json',
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert expected_fragment in mail.outbox[0].body


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


@pytest.mark.django_db
@pytest.mark.parametrize('error_class', [RuntimeError, ConnectionError, TimeoutError])
def test_dispatch_failure_preserves_the_lead_without_contact_data_in_logs(
    api_client, caplog, error_class,
):
    """Falla si una cola caída convierte un contacto guardado en 500 o filtra sus datos al log."""
    dispatch_error = error_class(f"queue rejected {PAYLOAD['email']} {PAYLOAD['full_name']} {PAYLOAD['message']}")

    with patch('core_app.views.leads_views.send_lead_notification', side_effect=dispatch_error) as notify:
        response = api_client.post(reverse('lead-list'), PAYLOAD, format='json')

    lead = Lead.objects.get()
    assert (response.status_code, Lead.objects.count(), lead.email) == (
        status.HTTP_201_CREATED,
        1,
        PAYLOAD['email'],
    )
    notify.assert_called_once_with(lead.pk)
    assert caplog.records[-1].getMessage() == (
        f'Lead notification dispatch failed: error_type={error_class.__name__}'
    )
    assert (caplog.records[-1].error_type, caplog.records[-1].exc_info) == (error_class.__name__, None)
    assert (
        PAYLOAD['email'] not in caplog.text,
        PAYLOAD['full_name'] not in caplog.text,
        PAYLOAD['message'] not in caplog.text,
        'queue rejected' not in caplog.text,
        'Traceback' not in caplog.text,
    ) == (True, True, True, True, True)


@pytest.mark.django_db
def test_invalid_lead_input_is_not_persisted(api_client):
    """Falla si el manejo de errores posterior al guardado alcanza una solicitud inválida."""
    invalid_payload = {**PAYLOAD, 'email': 'not-an-email'}

    with patch('core_app.views.leads_views.send_lead_notification') as notify:
        response = api_client.post(reverse('lead-list'), invalid_payload, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'email' in response.data
    assert Lead.objects.count() == 0
    notify.assert_not_called()
