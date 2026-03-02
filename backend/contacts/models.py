from django.db import models
from organizations.models import Organization
from companies.models import Company


class Contact(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=100, blank=True)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='contacts',
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='contacts',
    )
    is_deleted = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contacts'
        ordering = ['-created']
        unique_together = [['company', 'email']]

    def __str__(self):
        return self.full_name
