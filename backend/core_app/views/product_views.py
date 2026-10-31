from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import generics
from rest_framework.permissions import AllowAny

from core_app.models import Product
from core_app.serializers.product_serializers import ProductSerializer


@method_decorator(never_cache, name='dispatch')
class ProductListView(generics.ListAPIView):
    """A fixed, small catalogue. All changes belong to the Django admin."""

    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    pagination_class = None
    queryset = Product.objects.all()
