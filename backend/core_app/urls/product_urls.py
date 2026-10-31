from django.urls import path

from core_app.views.product_views import ProductListView


urlpatterns = [path('', ProductListView.as_view(), name='products')]
