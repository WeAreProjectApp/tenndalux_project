from rest_framework import viewsets

from core_app.models import Service, ProcessStep
from core_app.permissions import IsContentEditorOrReadOnly
from core_app.serializers import ServiceSerializer, ProcessStepSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [IsContentEditorOrReadOnly]

    def get_queryset(self):
        qs = Service.objects.all()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)
        return qs


class ProcessStepViewSet(viewsets.ModelViewSet):
    serializer_class = ProcessStepSerializer
    permission_classes = [IsContentEditorOrReadOnly]

    def get_queryset(self):
        qs = ProcessStep.objects.all()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)
        return qs
