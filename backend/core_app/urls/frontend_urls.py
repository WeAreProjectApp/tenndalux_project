"""
URL patterns for serving Next.js static export pages via Django.
"""

from django.urls import path
from core_app.views.frontend_views import (
    home,
    productos,
    servicios,
    garantias,
    portafolio,
    portafolio_detail,
    blog,
    blog_detail,
    auth_login,
    auth_register,
    dashboard,
)

urlpatterns = [
    path('', home, name='home'),
    path('productos/', productos, name='productos'),
    path('servicios/', servicios, name='servicios'),
    path('garantias/', garantias, name='garantias'),
    path('portafolio/', portafolio, name='portafolio'),
    path('portafolio/<slug:slug>/', portafolio_detail, name='portafolio_detail'),
    path('blog/', blog, name='blog'),
    path('blog/<slug:slug>/', blog_detail, name='blog_detail'),
    path('auth/login/', auth_login, name='auth_login'),
    path('auth/register/', auth_register, name='auth_register'),
    path('dashboard/', dashboard, name='dashboard'),
]
