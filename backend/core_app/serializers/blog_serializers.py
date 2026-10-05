from rest_framework import serializers

from core_app.serializers.fields import (
    ContentBlocksField,
    ContentBlocksListSerializer,
    library_image_url,
)
from core_app.utils.content_blocks import estimate_read_minutes

from core_app.models import Tag, Post


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class PostSerializer(serializers.ModelSerializer):
    content_blocks = ContentBlocksField(required=False)
    cover_image_url = serializers.SerializerMethodField()
    read_time_minutes = serializers.SerializerMethodField()

    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source='tags',
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Post
        list_serializer_class = ContentBlocksListSerializer
        fields = [
            'id',
            'title',
            'slug',
            'excerpt',
            'content',
            'content_blocks',
            'cover_image',
            'cover_image_url',
            'read_time_minutes',
            'author',
            'tags',
            'tag_ids',
            'is_published',
            'published_at',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'published_at', 'created_at', 'updated_at']

    def get_cover_image_url(self, obj):
        return library_image_url(obj.cover_image)

    def get_read_time_minutes(self, obj):
        return estimate_read_minutes(obj.content_blocks)
