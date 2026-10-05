from rest_framework import viewsets

from core_app.models import Tag, Post
from core_app.permissions import IsContentEditorOrReadOnly
from core_app.serializers import TagSerializer, PostSerializer


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsContentEditorOrReadOnly]


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsContentEditorOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = Post.objects.all()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_published=True)
        return qs
