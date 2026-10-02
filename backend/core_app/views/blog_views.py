from rest_framework import viewsets, permissions

from core_app.models import Tag, Post
from core_app.serializers import TagSerializer, PostSerializer


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = Post.objects.select_related('cover_image__primary_attachment').prefetch_related('tags')
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_published=True)
        return qs
