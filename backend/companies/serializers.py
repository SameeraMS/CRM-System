from rest_framework import serializers
from .models import Company
from .storage_backends import get_storage_backend


class CompanySerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'industry', 'country', 'logo', 'logo_url',
            'organization', 'organization_name', 'is_deleted', 'created',
        ]
        read_only_fields = ['id', 'organization', 'created']

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        storage = get_storage_backend()
        return storage.url(obj.logo.name)

    def get_organization_name(self, obj):
        return obj.organization.name if obj.organization else None


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'industry', 'country', 'logo', 'logo_url',
            'organization', 'is_deleted', 'created',
        ]
        read_only_fields = ['id', 'organization', 'created']

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        storage = get_storage_backend()
        return storage.url(obj.logo.name)
