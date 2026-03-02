from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_username', 'action_type', 'model_name', 'object_id', 'timestamp', 'organization_id', 'extra_data']
