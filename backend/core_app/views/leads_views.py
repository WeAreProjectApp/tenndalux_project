from rest_framework import viewsets, permissions

from core_app.models import LeadStatus, Lead
from core_app.permissions import IsRoleAdmin, IsRoleAdminOrReadOnly
from core_app.serializers import LeadStatusSerializer, LeadSerializer
from core_app.serializers.leads_serializers import LeadCaptureSerializer
from core_app.tasks import send_lead_notification


class LeadStatusViewSet(viewsets.ModelViewSet):
    queryset = LeadStatus.objects.all()
    serializer_class = LeadStatusSerializer
    permission_classes = [IsRoleAdminOrReadOnly]


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return LeadCaptureSerializer
        return super().get_serializer_class()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsRoleAdmin()]

    def perform_create(self, serializer):
        lead = serializer.save()
        # Queued, never inline: a slow or broken SMTP must not turn a captured
        # lead into a 500 for the person who just filled the form.
        send_lead_notification(lead.pk)
