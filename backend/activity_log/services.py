"""Activity log service - create audit records for CREATE/UPDATE/DELETE."""
from .models import ActivityLog, ActionType


def log_activity(user, action_type: ActionType, model_name: str, object_id, organization_id=None, extra_data=None):
    ActivityLog.objects.create(
        user=user,
        action_type=action_type,
        model_name=model_name,
        object_id=str(object_id),
        organization_id=organization_id,
        extra_data=extra_data or {},
    )
