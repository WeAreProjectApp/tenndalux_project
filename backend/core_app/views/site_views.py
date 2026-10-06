from rest_framework import generics
from rest_framework.permissions import AllowAny

from core_app.models import SiteSettings, HomePage, AboutPage, WarrantyDocument
from core_app.permissions import IsRoleAdminOrReadOnly
from core_app.serializers import SiteSettingsSerializer, HomePageSerializer, AboutPageSerializer
from core_app.serializers.site_serializers import WarrantyDocumentSerializer


class _SingletonPermissionsMixin:
    permission_classes = [IsRoleAdminOrReadOnly]


class SiteSettingsView(_SingletonPermissionsMixin, generics.RetrieveUpdateAPIView):
    serializer_class = SiteSettingsSerializer

    def get_object(self):
        return SiteSettings.load()


class HomePageView(_SingletonPermissionsMixin, generics.RetrieveUpdateAPIView):
    serializer_class = HomePageSerializer

    def get_object(self):
        return HomePage.load()


class AboutPageView(_SingletonPermissionsMixin, generics.RetrieveUpdateAPIView):
    serializer_class = AboutPageSerializer

    def get_object(self):
        return AboutPage.load()


class WarrantyDocumentListView(generics.ListAPIView):
    """Published documents only; edits belong to the session-protected admin."""

    permission_classes = [AllowAny]
    serializer_class = WarrantyDocumentSerializer
    pagination_class = None
    queryset = WarrantyDocument.objects.filter(is_published=True)
