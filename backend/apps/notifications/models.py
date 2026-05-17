import uuid

from django.db import models
from apps.users.models import User


class Notification(models.Model):
    TYPE_CHOICES = [
        ("new_supplier", "New Supplier Registration"),
        ("supplier_approved", "Supplier Approved"),
        ("supplier_rejected", "Supplier Rejected"),
        ("new_bid", "New Bid Submitted"),
        ("bid_won", "Bid Won"),
        ("bid_lost", "Bid Lost"),
        ("project_published", "Project Published"),
        ("project_awarded", "Project Awarded"),
        ("procurement_request", "New Procurement Request"),
        ("request_approved", "Procurement Request Approved"),
        ("request_rejected", "Procurement Request Rejected"),
        ("winner_selected", "Winner Selected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, null=True)
    related_id = models.CharField(max_length=64, null=True, blank=True)
    resource_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        choices=[
            ("project", "Project"),
            ("bid", "Bid"),
            ("request", "Procurement Request"),
            ("supplier", "Supplier"),
            ("user", "User"),
        ],
    )
    resource_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} → {self.recipient.email}"
