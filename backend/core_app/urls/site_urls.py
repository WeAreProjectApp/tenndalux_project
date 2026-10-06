from django.urls import path

from core_app.views.site_views import (
    SiteSettingsView, HomePageView, AboutPageView, WarrantyDocumentListView,
)


urlpatterns = [
    path('settings/', SiteSettingsView.as_view(), name='site-settings'),
    path('home/', HomePageView.as_view(), name='home-page'),
    path('about/', AboutPageView.as_view(), name='about-page'),
    path('warranties/', WarrantyDocumentListView.as_view(), name='warranty-documents'),
]
