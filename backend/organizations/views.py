from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Organization
from .serializers import OrganizationSerializer, OrganizationCreateSerializer
from users.permissions import IsSuperAdmin


class OrganizationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrganizationCreateSerializer
        return OrganizationSerializer

    def get_queryset(self):
        return Organization.objects.all().order_by('-created')


class OrganizationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Organizations can be retrieved, updated, and deleted by superadmin only."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = OrganizationSerializer
    queryset = Organization.objects.all()
