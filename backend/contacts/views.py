from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Contact
from companies.models import Company
from .serializers import ContactSerializer, ContactCreateUpdateSerializer
from users.permissions import CanDeleteRecord, CanEditRecord, IsSuperAdminOrOrgUser
from activity_log.services import log_activity
from activity_log.models import ActionType


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [IsSuperAdminOrOrgUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'email', 'role']
    ordering_fields = ['created', 'full_name']
    ordering = ['-created']

    def get_queryset(self):
        user = self.request.user
        qs = Contact.objects.filter(is_deleted=False).select_related('company', 'organization')
        if user.role == 'superadmin':
            return qs
        return qs.filter(organization_id=user.organization_id)

    def get_queryset_for_company(self, company_id):
        qs = self.get_queryset()
        return qs.filter(company_id=company_id)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        company_id = self.kwargs.get('company_pk')
        if company_id:
            ctx['company'] = Company.objects.filter(pk=company_id).first()
        return ctx

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ContactCreateUpdateSerializer
        return ContactSerializer

    def get_permissions(self):
        perms = [IsSuperAdminOrOrgUser()]
        if self.action == 'destroy':
            perms.append(CanDeleteRecord())  # Only Admin + SuperAdmin can delete
        elif self.action in ('update', 'partial_update'):
            perms.append(CanEditRecord())  # Manager can edit, Staff cannot
        return perms

    def perform_create(self, serializer):
        user = self.request.user
        company_id = self.kwargs.get('company_pk')
        if company_id:
            company = get_object_or_404(Company, pk=company_id)
            org_id = company.organization_id
            serializer.save(company=company, organization_id=org_id)
        else:
            org_id = user.organization_id or serializer.validated_data.get('organization_id')
            serializer.save(organization_id=org_id)
        log_activity(user, ActionType.CREATE, 'Contact', serializer.instance.id, organization_id=serializer.instance.organization_id)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        log_activity(
            self.request.user,
            ActionType.UPDATE,
            'Contact',
            serializer.instance.id,
            organization_id=serializer.instance.organization_id,
        )

    def perform_destroy(self, instance):
        user = self.request.user
        org_id = instance.organization_id
        pk = instance.id
        instance.is_deleted = True
        instance.save()
        log_activity(user, ActionType.DELETE, 'Contact', pk, organization_id=org_id)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContactNestedViewSet(ContactViewSet):
    """Contacts nested under a company: /companies/<id>/contacts/ — company comes from URL."""
    def get_queryset(self):
        qs = super().get_queryset()
        company_id = self.kwargs.get('company_pk')
        if company_id:
            qs = qs.filter(company_id=company_id)
        return qs

    def create(self, request, *args, **kwargs):
        """Inject company from URL so serializer receives it (no need to send from client)."""
        company_pk = self.kwargs.get('company_pk')
        if company_pk:
            try:
                data = request.data.copy()
            except AttributeError:
                data = dict(list(request.data.items()) if hasattr(request.data, 'items') else {})
            data['company'] = int(company_pk)
            serializer = self.get_serializer(data=data)
        else:
            serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        company = get_object_or_404(Company, pk=self.kwargs['company_pk'])
        user = self.request.user
        if user.role != 'superadmin' and company.organization_id != user.organization_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Company does not belong to your organization.')
        serializer.save(company=company, organization_id=company.organization_id)
        log_activity(
            self.request.user,
            ActionType.CREATE,
            'Contact',
            serializer.instance.id,
            organization_id=company.organization_id,
        )
