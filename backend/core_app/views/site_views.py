from django.db.models import Prefetch, prefetch_related_objects
from rest_framework import generics
from rest_framework.permissions import AllowAny

from core_app.models import SiteSettings, HomePage, AboutPage, Project, WarrantyDocument
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
        home = HomePage.load()
        projects = Project.objects.select_related('gallery__primary_attachment').prefetch_related(
            'categories', 'styles', 'spaces'
        )
        if not self.request.user.is_authenticated:
            projects = projects.filter(is_published=True)
        prefetch_related_objects(
            [home], Prefetch('featured_projects', queryset=projects)
        )
        return home


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
