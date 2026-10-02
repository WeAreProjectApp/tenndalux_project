import logging

from rest_framework import viewsets, permissions

from core_app.models import LeadStatus, Lead
from core_app.serializers import LeadStatusSerializer, LeadSerializer
from core_app.tasks import send_lead_notification


logger = logging.getLogger(__name__)


class LeadStatusViewSet(viewsets.ModelViewSet):
    queryset = LeadStatus.objects.all()
    serializer_class = LeadStatusSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('project_type', 'status').prefetch_related('space_types')
    serializer_class = LeadSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        lead = serializer.save()
        # Notification dispatch is secondary to storing the captured lead.
        try:
            send_lead_notification(lead.pk)
        except Exception as exc:
            logger.warning(
                'Lead notification dispatch failed: error_type=%s',
                type(exc).__name__,
                extra={'error_type': type(exc).__name__},
            )
