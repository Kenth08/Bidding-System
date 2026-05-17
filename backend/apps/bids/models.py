import uuid

from django.conf import settings
from django.db import models


class Bid(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_EVALUATION = "under_evaluation", "Under Evaluation"
        WON = "won", "Won"
        LOST = "lost", "Lost"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="bids")
    supplier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bids")
    company_name = models.CharField(max_length=255, blank=True, default="")
    bid_amount = models.DecimalField(max_digits=12, decimal_places=2)
    proposal = models.TextField(blank=True, default="")
    quotation_file = models.FileField(upload_to="bids/quotations/", null=True, blank=True)
    technical_proposal = models.FileField(upload_to="bids/proposals/", null=True, blank=True)
    supporting_documents = models.FileField(upload_to="bids/documents/", null=True, blank=True)
    quotation_document = models.FileField(upload_to="bids/quotations/", blank=True, null=True)
    technical_document = models.FileField(upload_to="bids/technical/", blank=True, null=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.SUBMITTED)
    technical_compliance = models.BooleanField(null=True, blank=True)
    evaluation_remarks = models.TextField(blank=True, default="")
    rank = models.PositiveIntegerField(null=True, blank=True)
    recorded = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("project", "supplier")

    def __str__(self):
        return f"Bid {self.id} for {self.project}"
