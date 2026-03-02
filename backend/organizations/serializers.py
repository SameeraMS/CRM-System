from rest_framework import serializers
from .models import Organization, SubscriptionPlan


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'subscription_plan', 'br_number', 'created']


class OrganizationCreateSerializer(serializers.ModelSerializer):
    """SuperAdmin creates org + first admin user in one payload."""
    # Admin user fields
    admin_username = serializers.CharField(write_only=True)
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_telephone = serializers.CharField(required=False, allow_blank=True, max_length=20)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'subscription_plan', 'br_number', 'created',
            'admin_username', 'admin_email', 'admin_password', 'admin_telephone',
        ]
        read_only_fields = ['id', 'created']

    def create(self, validated_data):
        from users.models import User, Role
        admin_username = validated_data.pop('admin_username')
        admin_email = validated_data.pop('admin_email')
        admin_password = validated_data.pop('admin_password')
        admin_telephone = validated_data.pop('admin_telephone', '')
        org = Organization.objects.create(**validated_data)
        User.objects.create_user(
            username=admin_username,
            email=admin_email,
            password=admin_password,
            organization=org,
            role=Role.ADMIN,
            telephone=admin_telephone,
        )
        return org
