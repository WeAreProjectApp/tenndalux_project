from collections.abc import Mapping

from rest_framework import serializers

from core_app.models import LeadStatus, Lead, Category, Space
from core_app.serializers.portfolio_serializers import CategorySerializer, SpaceSerializer


class LeadStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadStatus
        fields = ['id', 'name', 'color', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeadSerializer(serializers.ModelSerializer):
    project_type = CategorySerializer(read_only=True)
    project_type_id = serializers.PrimaryKeyRelatedField(
        source='project_type',
        queryset=Category.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    space_types = SpaceSerializer(many=True, read_only=True)
    space_type_ids = serializers.PrimaryKeyRelatedField(
        source='space_types',
        many=True,
        queryset=Space.objects.all(),
        write_only=True,
        required=False,
    )

    status = LeadStatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        source='status',
        queryset=LeadStatus.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Lead
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'city',
            'spaces_count',
            'project_type',
            'project_type_id',
            'space_types',
            'space_type_ids',
            'message',
            'budget_range',
            'how_found_us',
            'source',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'status',
            'status_id',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeadCaptureSerializer(LeadSerializer):
    """Capture public contact details without accepting internal CRM fields."""

    class Meta(LeadSerializer.Meta):
        fields = [
            field for field in LeadSerializer.Meta.fields
            if field not in ('status', 'status_id', 'notes')
        ]

    def to_internal_value(self, data):
        if isinstance(data, Mapping):
            errors = {
                field: ['Este campo está reservado a la administración.']
                for field in ('status', 'status_id', 'notes') if field in data
            }
            if errors:
                raise serializers.ValidationError(errors)
        return super().to_internal_value(data)
