"""Role-based and tenant-scoped permissions."""
from rest_framework import permissions
from .models import Role


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == Role.SUPERADMIN


class IsOrgAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == Role.ADMIN


class IsManagerOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (Role.ADMIN, Role.MANAGER)


class CanDeleteRecord(permissions.BasePermission):
    """Only Admin and SuperAdmin can delete."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (Role.SUPERADMIN, Role.ADMIN)


class CanEditRecord(permissions.BasePermission):
    """Admin, Manager can edit; SuperAdmin can edit."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (Role.SUPERADMIN, Role.ADMIN, Role.MANAGER)


class IsSuperAdminOrOrgUser(permissions.BasePermission):
    """Allow SuperAdmin (no org) or any user belonging to an org."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == Role.SUPERADMIN:
            return True
        return request.user.organization_id is not None


class CanCreateUser(permissions.BasePermission):
    """SuperAdmin, Admin, or Manager can create users (e.g. team members)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (Role.SUPERADMIN, Role.ADMIN, Role.MANAGER)
