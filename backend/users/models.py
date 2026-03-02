from django.db import models
from django.contrib.auth.models import AbstractUser
from organizations.models import Organization


class Role(models.TextChoices):
    SUPERADMIN = 'superadmin', 'Super Admin'
    ADMIN = 'admin', 'Admin'
    MANAGER = 'manager', 'Manager'
    STAFF = 'staff', 'Staff'


class User(AbstractUser):
    """User belongs to an organization (null only for superadmin)."""
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='users',
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STAFF,
    )
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'users'
        ordering = ['-created']

    def __str__(self):
        return self.username

    @property
    def is_superadmin(self):
        return self.role == Role.SUPERADMIN

    @property
    def is_org_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_manager(self):
        return self.role == Role.MANAGER

    @property
    def is_staff_role(self):
        """True if role is Staff (do not confuse with Django's is_staff for admin access)."""
        return self.role == Role.STAFF

    def can_delete(self):
        return self.is_superadmin or self.is_org_admin

    def can_edit(self):
        return self.is_superadmin or self.is_org_admin or self.is_manager

    def can_write(self):
        return True  # All authenticated org users have some write
