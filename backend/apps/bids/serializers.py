from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Bid

User = get_user_model()


class BidSerializer(serializers.ModelSerializer):
    projectTitle = serializers.CharField(source="project.title", read_only=True)
    projectName = serializers.CharField(source="project.title", read_only=True)
    supplierName = serializers.CharField(source="supplier.full_name", read_only=True)
    supplierCompany = serializers.CharField(source="supplier.company_name", read_only=True)
    bidAmount = serializers.DecimalField(source="bid_amount", max_digits=15, decimal_places=2, read_only=True)
    submittedAt = serializers.DateTimeField(source="submitted_at", format="%Y-%m-%d", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", format="%Y-%m-%d", read_only=True)

    class Meta:
        model = Bid
        fields = [
            "id",
            "project",
            "projectTitle",
            "projectName",
            "supplier",
            "supplierName",
            "supplierCompany",
            "bid_amount",
            "bidAmount",
            "proposal",
            "status",
            "recorded",
            "submitted_at",
            "submittedAt",
            "updated_at",
            "updatedAt",
        ]
        read_only_fields = ["supplier", "recorded", "submitted_at", "submittedAt", "updated_at", "updatedAt"]
