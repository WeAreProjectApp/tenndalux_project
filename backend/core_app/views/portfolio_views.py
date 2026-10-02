from rest_framework import viewsets

from core_app.models import Category, Style, Space, Project
from core_app.permissions import IsContentEditorOrReadOnly
from core_app.serializers import (
    CategorySerializer,
    StyleSerializer,
    SpaceSerializer,
    ProjectSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsContentEditorOrReadOnly]


class StyleViewSet(viewsets.ModelViewSet):
    queryset = Style.objects.all()
    serializer_class = StyleSerializer
    permission_classes = [IsContentEditorOrReadOnly]


class SpaceViewSet(viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [IsContentEditorOrReadOnly]


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsContentEditorOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = Project.objects.all()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_published=True)
        return qs
