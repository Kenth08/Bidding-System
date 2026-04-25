from django.conf import settings
from django.db import models


class Profile(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        SUPPLIER = "supplier", "Supplier"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SUPPLIER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    company_name = models.CharField(max_length=255, blank=True, default="")
    company_address = models.CharField(max_length=255, blank=True, default="")
    phone = models.CharField(max_length=50, blank=True, default="")
    business_type = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} ({self.role})"
