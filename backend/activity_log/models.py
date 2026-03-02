from django.db import models
from users.models import User


class ActionType(models.TextChoices):
    CREATE = 'CREATE', 'Create'
    UPDATE = 'UPDATE', 'Update'
    DELETE = 'DELETE', 'Delete'


class ActivityLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activity_logs',
    )
    action_type = models.CharField(max_length=10, choices=ActionType.choices)
    model_name = models.CharField(max_length=50)
    object_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    # For multi-tenant: organization context (optional, for filtering)
    organization_id = models.PositiveIntegerField(null=True, blank=True)
    extra_data = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action_type} {self.model_name}#{self.object_id} by {self.user_id}"
