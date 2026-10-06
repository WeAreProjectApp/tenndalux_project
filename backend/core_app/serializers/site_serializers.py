from rest_framework import serializers

from core_app.models import SiteSettings, HomePage, AboutPage, Project, WarrantyDocument
from core_app.serializers.fields import library_image_url
from core_app.serializers.portfolio_serializers import ProjectSerializer


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            'id',
            'company_name',
            'tagline',
            'phone',
            'whatsapp_number',
            'email',
            'address',
            'city',
            'social_instagram',
            'social_facebook',
            'social_youtube',
            'social_tiktok',
            'logo',
            'favicon',
            'footer_text',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HomePageSerializer(serializers.ModelSerializer):
    hero_image_url = serializers.SerializerMethodField()
    featured_projects = ProjectSerializer(many=True, read_only=True)
    featured_project_ids = serializers.PrimaryKeyRelatedField(
        source='featured_projects',
        many=True,
        queryset=Project.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = HomePage
        fields = [
            'id',
            'hero_title',
            'hero_subtitle',
            'hero_cta_text',
            'hero_media',
            'hero_image_url',
            'value_proposition_title',
            'value_proposition_items',
            'featured_projects',
            'featured_project_ids',
            'testimonials_section',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_hero_image_url(self, obj):
        return library_image_url(obj.hero_media)


class WarrantyDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(source='document', read_only=True)

    class Meta:
        model = WarrantyDocument
        fields = ['id', 'title', 'file_url']
        read_only_fields = fields


class AboutPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPage
        fields = [
            'id',
            'title',
            'content',
            'team_section',
            'gallery',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
