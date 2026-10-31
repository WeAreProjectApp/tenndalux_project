from rest_framework import serializers

from core_app.models import Product


class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = ('key', 'name', 'category', 'description', 'image_url')
        read_only_fields = fields
