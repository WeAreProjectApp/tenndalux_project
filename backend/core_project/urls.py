"""
URL configuration for core_project.

Maps URL patterns to views and includes module-specific URL configurations.
"""
import os

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve


def health_check(request):
    # 'project'/'environment' let external probes verify WHO answered: a shared
    # codebase means the project name alone cannot tell prod from staging
    # (measured: /qa pilot #3).
    return JsonResponse({
        'status': 'ok',
        'project': settings.BASE_DIR.parent.name,
        # settings first: DJANGO_ENV lives in backend/.env and is read by
        # decouple, and the systemd units never export it, so os.getenv alone
        # would report 'development' in production.
        'environment': getattr(
            settings, 'DJANGO_ENV', os.getenv('DJANGO_ENV', 'development')
        ),
    })


urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    
    # API endpoints
    path('api/auth/', include('core_app.urls.auth_urls')),
    path('api/portfolio/', include('core_app.urls.portfolio_urls')),
    path('api/blog/', include('core_app.urls.blog_urls')),
    path('api/services/', include('core_app.urls.services_urls')),
    path('api/products/', include('core_app.urls.product_urls')),
    path('api/leads/', include('core_app.urls.leads_urls')),
    path('api/site/', include('core_app.urls.site_urls')),

    # Herramientas del editor de bloques del admin (sesión de staff, no JWT)
    path('admin-tools/', include('core_app.urls.admin_tools_urls')),

    # Frontend pages (Next.js static export served by Django)
    path('', include('core_app.urls.frontend_urls')),
]

# Serve Next.js static assets (_next/), public folder assets, and media files
if settings.DEBUG:
    urlpatterns += [
        re_path(r'^_next/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'static' / '_next'}),
        re_path(r'^home/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'static' / 'home'}),
        re_path(r'^videos/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'static' / 'videos'}),
        re_path(r'^products/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'static' / 'products'}),
        re_path(r'^legal/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'static' / 'legal'}),
        # Root-level public/ assets (logo, svgs, favicon). Mirrors the regex
        # location in scripts/nginx/tenndalux.conf so dev matches production.
        re_path(
            r'^(?P<path>[^/]+\.(?:png|jpe?g|webp|svg|ico|txt|xml|webmanifest))$',
            serve,
            {'document_root': settings.BASE_DIR / 'static'},
        ),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom 404 handler
handler404 = 'core_app.views.frontend_views.not_found'

if getattr(settings, 'ENABLE_SILK', False):
    urlpatterns.insert(0, path('silk/', include('silk.urls', namespace='silk')))
