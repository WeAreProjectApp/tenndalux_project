"""
Background tasks.

Discovered automatically by ``huey.contrib.djhuey``. Settings run Huey with
``immediate=not IS_PRODUCTION``, so these execute inline during development and
through the ``tenndalux-huey`` worker in production.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMessage
from huey.contrib.djhuey import db_task

from core_app.models import Lead


logger = logging.getLogger(__name__)


def _format_lead_body(lead: Lead) -> str:
    rows = [
        ('Nombre', lead.full_name),
        ('Email', lead.email),
        ('Teléfono', lead.phone),
        ('Ubicación del proyecto', lead.city),
        ('Cantidad de espacios', lead.spaces_count),
        ('Origen', lead.source),
        ('Recibido', lead.created_at.strftime('%Y-%m-%d %H:%M')),
    ]
    details = '\n'.join(f'{label}: {value}' for label, value in rows if value)

    if lead.message:
        details = f'{details}\n\nMensaje:\n{lead.message}'

    return f'Nueva solicitud desde la web.\n\n{details}\n'


@db_task()
def send_lead_notification(lead_id: int) -> None:
    """Email a freshly submitted lead to whoever is configured to receive it."""
    recipients = settings.LEADS_NOTIFICATION_EMAILS
    if not recipients:
        # Expected until the client hands over the address: the lead is already
        # stored, so nothing is lost by not notifying yet.
        logger.info('LEADS_NOTIFICATION_EMAILS is empty; skipping lead %s', lead_id)
        return

    lead = Lead.objects.filter(pk=lead_id).first()
    if lead is None:
        logger.warning('Lead %s vanished before its notification was sent', lead_id)
        return

    message = EmailMessage(
        subject=f'{settings.LEADS_NOTIFICATION_SUBJECT_PREFIX} Nueva solicitud de {lead.full_name}',
        body=_format_lead_body(lead),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipients,
        # Answering the notification replies to the person who filled the form.
        reply_to=[lead.email] if lead.email else None,
    )

    try:
        message.send()
    except Exception as exc:
        # Huey runs immediately outside production, so an SMTP error here would
        # surface as a 500 to the visitor whose lead was already saved. The lead
        # matters more than the notification: log and move on.
        # SMTP exception messages and tracebacks may contain private addresses.
        logger.error(
            'Lead notification delivery failed; error_type=%s',
            type(exc).__name__,
        )
