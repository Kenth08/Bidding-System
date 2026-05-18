import uuid
from datetime import date

from django.conf import settings
from django.db import models


class Project(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"
        AWARDED = "awarded", "Awarded"

    class ProcurementType(models.TextChoices):
        GOODS = "Goods", "Goods"
        INFRASTRUCTURE = "Infrastructure", "Infrastructure"
        CONSULTING = "Consulting", "Consulting"
        SERVICES = "Services", "Services"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    procurement_request = models.OneToOneField(
        "Procurement",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="project",
    )
    title = models.CharField(max_length=255)
    budget = models.DecimalField(max_digits=15, decimal_places=2)
    deadline = models.DateField()
    public_result_expiry_date = models.DateField(null=True, blank=True)
    requirements = models.TextField(blank=True, default="")
    procurement_type = models.CharField(max_length=50, choices=ProcurementType.choices, default=ProcurementType.SERVICES)
    delivery_period = models.PositiveIntegerField(default=0)
    technical_specifications = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_reason = models.CharField(max_length=255, blank=True, null=True, help_text="Reason for archiving this project")
    awarded_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="projects")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.deadline and self.deadline < date.today() and self.status == self.Status.ACTIVE:
            self.status = self.Status.CLOSED
        super().save(*args, **kwargs)


class Procurement(models.Model):
    class Status(models.TextChoices):
        PENDING_REVIEW = "Pending Review", "Pending Review"
        APPROVED = "Approved", "Approved"
        REJECTED = "Rejected", "Rejected"
        REVISION_REQUIRED = "Revision Required", "Revision Required"

    class Type(models.TextChoices):
        GOODS = "Goods", "Goods"
        SERVICES = "Services", "Services"
        INFRASTRUCTURE = "Infrastructure", "Infrastructure"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_title = models.CharField(max_length=255)
    budget = models.DecimalField(max_digits=15, decimal_places=2)
    deadline = models.DateField(null=True, blank=True)
    public_result_expiry_date = models.DateField(null=True, blank=True)
    procurement_type = models.CharField(max_length=50, choices=Type.choices)
    technical_specifications = models.TextField(blank=True, default="")
    procurement_schedule = models.CharField(max_length=255, blank=True, default="")
    delivery_period = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING_REVIEW)
    rejection_reason = models.TextField(blank=True, default="")
    revision_notes = models.TextField(blank=True, default="")
    review_remarks = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_procurements",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="procurements")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.project_title

    class Meta:
        db_table = "procurements"


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "CREATE", "Created"
        UPDATE = "UPDATE", "Updated"
        DELETE = "DELETE", "Deleted"
        LOGIN = "LOGIN", "Logged In"
        LOGOUT = "LOGOUT", "Logged Out"
        APPROVE = "APPROVE", "Approved"
        REJECT = "REJECT", "Rejected"
        SUBMIT_BID = "SUBMIT_BID", "Submitted Bid"
        SELECT_WINNER = "SELECT_WINNER", "Selected Winner"
        RECORD_BLOCKCHAIN = "RECORD_BLOCKCHAIN", "Recorded on Blockchain"
        DOWNLOAD_REPORT = "DOWNLOAD_REPORT", "Downloaded Report"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=50, choices=Action.choices)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs")
    description = models.TextField(blank=True, default="")
    resource_type = models.CharField(max_length=100, blank=True, default="")
    resource_id = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user.email if self.user else 'Unknown'}"

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]


class DocumentUpload(models.Model):
    class DocumentType(models.TextChoices):
        LEGAL_DOCUMENTS = "Legal Documents", "Legal Documents"
        BUSINESS_PERMIT = "Business Permit", "Business Permit"
        PHILGEPS_REGISTRATION = "PhilGEPS Registration", "PhilGEPS Registration"
        QUOTATION = "Quotation", "Quotation"
        SUPPORTING_DOCUMENTS = "Supporting Documents", "Supporting Documents"

    class VerificationStatus(models.TextChoices):
        PENDING = "Pending", "Pending"
        VERIFIED = "Verified", "Verified"
        REJECTED = "Rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="document_uploads")
    document_type = models.CharField(max_length=50, choices=DocumentType.choices)
    file_name = models.CharField(max_length=255)
    file = models.FileField(upload_to="documents/", blank=True, null=True)
    file_size = models.IntegerField(default=0)
    verification_status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.document_type} - {self.user.email}"

    class Meta:
        db_table = "document_uploads"
