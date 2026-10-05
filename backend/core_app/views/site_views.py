from rest_framework import generics

from core_app.models import SiteSettings, HomePage, AboutPage
from core_app.permissions import IsRoleAdminOrReadOnly
from core_app.serializers import SiteSettingsSerializer, HomePageSerializer, AboutPageSerializer


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
