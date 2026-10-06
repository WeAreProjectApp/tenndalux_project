"""Read-only deployment checks for a client's CMS account and lead mailer."""

from email.utils import parseaddr
from smtplib import SMTPException

from django.conf import settings
from django.core.mail import get_connection
from django.core.management.base import BaseCommand, CommandError

from core_app.models import User

CONTENT_MODELS = (
    'post', 'project', 'tag', 'category', 'style', 'space', 'warrantydocument',
)
REQUIRED_PERMISSIONS = tuple(
    f'core_app.{action}_{model}'
    for model in CONTENT_MODELS
    for action in ('view', 'add', 'change')
) + (
    'core_app.view_homepage', 'core_app.change_homepage',
    'django_attachments.view_library', 'django_attachments.add_library',
    'django_attachments.change_library', 'django_attachments.view_attachment',
    'django_attachments.add_attachment', 'django_attachments.change_attachment',
    'django_attachments.delete_attachment',
)


class Command(BaseCommand):
    help = 'Comprueba accesos y correo sin modificar cuentas, archivos ni solicitudes.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Correo de la cuenta del cliente.')
        parser.add_argument(
            '--smtp-login', action='store_true',
            help='Comprueba conexión y autenticación SMTP; no envía ningún correo.',
        )

    def handle(self, *args, **options):
        email = options['email'].strip().casefold()
        pending = []
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            pending.append('No existe la cuenta del cliente; no se creó ni se cambió ninguna cuenta.')
        elif not user.is_active or not user.is_staff:
            pending.append('La cuenta no está activa o no tiene acceso al administrador.')
        else:
            missing = [perm for perm in REQUIRED_PERMISSIONS if not user.has_perm(perm)]
            pending.extend(f'Permiso pendiente: {perm}' for perm in missing)
            if not missing:
                self.stdout.write('Acceso y permisos del cliente: OK.')

        mailer = settings.MAILERS['default']
        smtp = mailer.get('OPTIONS', {})
        expected = {
            'BACKEND': mailer.get('BACKEND') == 'django.core.mail.backends.smtp.EmailBackend',
            'EMAIL_HOST': smtp.get('host') == 'smtp.gmail.com',
            'EMAIL_PORT': smtp.get('port') == 587,
            'EMAIL_USE_TLS': smtp.get('use_tls') is True,
            'EMAIL_USE_SSL': smtp.get('use_ssl', False) is False,
            'EMAIL_HOST_USER': str(smtp.get('username', '')).casefold() == email,
            'EMAIL_HOST_PASSWORD': bool(smtp.get('password')),
            'DEFAULT_FROM_EMAIL': parseaddr(settings.DEFAULT_FROM_EMAIL)[1].casefold() == email,
            'LEADS_NOTIFICATION_EMAILS': email in {
                address.casefold() for address in settings.LEADS_NOTIFICATION_EMAILS
            },
        }
        pending.extend(f'Configuración pendiente: {key}' for key, ok in expected.items() if not ok)
        if all(expected.values()):
            self.stdout.write('Configuración de Gmail y destinatario: OK. No se muestran secretos.')
            if options['smtp_login']:
                try:
                    with get_connection():
                        pass
                except (OSError, SMTPException) as exc:
                    pending.append(f'No se pudo autenticar SMTP: {type(exc).__name__}.')
                else:
                    self.stdout.write('Conexión y autenticación SMTP: OK. No se envió ningún correo.')

        if pending:
            raise CommandError('\n'.join(pending))
        self.stdout.write(self.style.SUCCESS('Comprobaciones completas. Falta confirmar la recepción con una solicitud autorizada.'))
