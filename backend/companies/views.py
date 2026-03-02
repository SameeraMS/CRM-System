from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer, CompanyCreateUpdateSerializer
from users.permissions import CanDeleteRecord, CanEditRecord, IsSuperAdminOrOrgUser
from activity_log.services import log_activity
from activity_log.models import ActionType

class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsSuperAdminOrOrgUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'industry', 'country']
    ordering_fields = ['created', 'name']
    ordering = ['-created']

    def get_queryset(self):
        user = self.request.user
        qs = Company.objects.filter(is_deleted=False).select_related('organization')
        if user.role == 'superadmin':
            org_id = self.request.query_params.get('organization')
            if org_id:
                try:
                    qs = qs.filter(organization_id=int(org_id))
                except (ValueError, TypeError):
                    pass
            return qs
        return qs.filter(organization_id=user.organization_id)

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return CompanyCreateUpdateSerializer
        return CompanySerializer

    def get_permissions(self):
        perms = [IsSuperAdminOrOrgUser()]
        if self.action == 'destroy':
            perms.append(CanDeleteRecord())  # Only Admin + SuperAdmin can delete
        elif self.action in ('update', 'partial_update'):
            perms.append(CanEditRecord())  # Manager can edit, Staff cannot
        return perms

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'superadmin':
            org_id = serializer.validated_data.get('organization_id')
            if org_id is None:
                org_id = serializer.validated_data.get('organization')
                org_id = org_id.id if org_id else None
        else:
            org_id = user.organization_id
        if not org_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'organization': 'Organization is required.'})
        serializer.save(organization_id=org_id)
        log_activity(user, ActionType.CREATE, 'Company', serializer.instance.id, organization_id=org_id)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        log_activity(
            self.request.user,
            ActionType.UPDATE,
            'Company',
            serializer.instance.id,
            organization_id=serializer.instance.organization_id,
        )

    def perform_destroy(self, instance):
        user = self.request.user
        org_id = instance.organization_id
        pk = instance.id
        instance.is_deleted = True
        instance.save()
        log_activity(user, ActionType.DELETE, 'Company', pk, organization_id=org_id)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
