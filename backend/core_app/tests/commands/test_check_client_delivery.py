"""Contracts for the read-only client delivery diagnostic command."""

from io import StringIO
from smtplib import SMTPAuthenticationError
from unittest.mock import MagicMock, patch

import pytest
from core_app.models import User
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings

CLIENT_EMAIL = 'client@example.test'
PRIVATE_PASSWORD_MARKER = 'smtp-private-password-marker'
VALID_MAILERS = {
    'default': {
        'BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
        'OPTIONS': {
            'host': 'smtp.gmail.com',
            'port': 587,
            'use_tls': True,
            'use_ssl': False,
            'username': CLIENT_EMAIL,
            'password': PRIVATE_PASSWORD_MARKER,
        },
    },
}


def _client_superuser():
    return User.objects.create_superuser(
        email=CLIENT_EMAIL,
        password='safe-password',
    )


@pytest.mark.django_db
@override_settings(
    MAILERS=VALID_MAILERS,
    DEFAULT_FROM_EMAIL=f'Tenndalux <{CLIENT_EMAIL}>',
    LEADS_NOTIFICATION_EMAILS=[CLIENT_EMAIL],
)
def test_delivery_diagnostic_reports_a_valid_client_configuration_without_password_output():
    """Falla si el diagnóstico correcto vuelve a mostrar la contraseña SMTP configurada."""
    _client_superuser()
    output = StringIO()

    call_command('check_client_delivery', '--email', CLIENT_EMAIL, stdout=output)

    assert 'Acceso y permisos del cliente: OK.' in output.getvalue()
    assert 'Configuración de Gmail y destinatario: OK.' in output.getvalue()
    assert PRIVATE_PASSWORD_MARKER not in output.getvalue()


@pytest.mark.django_db
@override_settings(
    MAILERS=VALID_MAILERS,
    DEFAULT_FROM_EMAIL=f'Tenndalux <{CLIENT_EMAIL}>',
    LEADS_NOTIFICATION_EMAILS=[CLIENT_EMAIL],
)
def test_delivery_diagnostic_keeps_user_count_when_the_client_account_is_missing():
    """Falla si la comprobación crea o modifica cuentas mientras informa una cuenta ausente."""
    before_count = User.objects.count()

    with pytest.raises(CommandError, match='No existe la cuenta del cliente'):
        call_command('check_client_delivery', '--email', CLIENT_EMAIL)

    assert User.objects.count() == before_count


@pytest.mark.django_db
@override_settings(
    DEFAULT_FROM_EMAIL=f'Tenndalux <{CLIENT_EMAIL}>',
    LEADS_NOTIFICATION_EMAILS=[CLIENT_EMAIL],
)
def test_delivery_diagnostic_names_only_the_invalid_mailer_setting():
    """Falla si el diagnóstico atribuye una configuración SMTP inválida a la clave equivocada."""
    _client_superuser()
    invalid_mailers = {
        'default': {
            **VALID_MAILERS['default'],
            'OPTIONS': {**VALID_MAILERS['default']['OPTIONS'], 'port': 465},
        },
    }

    with override_settings(MAILERS=invalid_mailers), pytest.raises(CommandError) as error:
        call_command('check_client_delivery', '--email', CLIENT_EMAIL)

    assert str(error.value) == 'Configuración pendiente: EMAIL_PORT'


@pytest.mark.django_db
@override_settings(
    MAILERS=VALID_MAILERS,
    DEFAULT_FROM_EMAIL=f'Tenndalux <{CLIENT_EMAIL}>',
    LEADS_NOTIFICATION_EMAILS=[CLIENT_EMAIL],
)
def test_delivery_diagnostic_redacts_an_smtp_authentication_failure():
    """Falla si una autenticación SMTP fallida vuelve a filtrar detalles privados del proveedor."""
    _client_superuser()
    connection = MagicMock()
    connection.__enter__.side_effect = SMTPAuthenticationError(
        535,
        b'smtp-auth-private-marker',
    )

    with patch(
        'core_app.management.commands.check_client_delivery.get_connection',
        return_value=connection,
    ) as connection_factory, pytest.raises(CommandError) as error:
        call_command('check_client_delivery', '--email', CLIENT_EMAIL, '--smtp-login')

    connection_factory.assert_called_once_with()
    assert str(error.value) == 'No se pudo autenticar SMTP: SMTPAuthenticationError.'
    assert 'smtp-auth-private-marker' not in str(error.value)
