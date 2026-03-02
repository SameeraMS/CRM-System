from rest_framework import viewsets, filters
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from users.permissions import IsSuperAdminOrOrgUser


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsSuperAdminOrOrgUser]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        user = self.request.user
        qs = ActivityLog.objects.all().select_related('user')
        if user.role == 'superadmin':
            return qs
        return qs.filter(organization_id=user.organization_id)
