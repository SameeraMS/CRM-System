from django.db import models


class SubscriptionPlan(models.TextChoices):
    BASIC = 'Basic', 'Basic'
    PRO = 'Pro', 'Pro'


class Organization(models.Model):
    name = models.CharField(max_length=255)
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.BASIC,
    )
    br_number = models.CharField(max_length=50, unique=True, null=True, blank=True)  # Business registration number
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'organizations'
        ordering = ['-created']

    def __str__(self):
        return self.name
