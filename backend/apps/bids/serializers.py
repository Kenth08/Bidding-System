from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Bid

User = get_user_model()


class BidSerializer(serializers.ModelSerializer):
    projectTitle = serializers.CharField(source="project.title", read_only=True)
    projectName = serializers.CharField(source="project.title", read_only=True)
    supplierName = serializers.CharField(source="supplier.full_name", read_only=True)
    supplierCompany = serializers.CharField(source="supplier.company_name", read_only=True)
    companyName = serializers.CharField(source="company_name", read_only=True)
    bidAmount = serializers.DecimalField(source="bid_amount", max_digits=15, decimal_places=2, read_only=True)
    submittedAt = serializers.DateTimeField(source="submitted_at", format="%Y-%m-%d", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", format="%Y-%m-%d", read_only=True)
    technicalCompliance = serializers.SerializerMethodField()
    quotationDocument = serializers.SerializerMethodField()
    technicalDocument = serializers.SerializerMethodField()

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
            "company_name",
            "companyName",
            "bid_amount",
            "bidAmount",
            "proposal",
            "status",
            "technical_compliance",
            "technicalCompliance",
            "evaluation_remarks",
            "rank",
            "quotation_document",
            "quotationDocument",
            "technical_document",
            "technicalDocument",
            "recorded",
            "submitted_at",
            "submittedAt",
            "updated_at",
            "updatedAt",
        ]
        read_only_fields = [
            "supplier",
            "company_name",
            "recorded",
            "rank",
            "submitted_at",
            "submittedAt",
            "updated_at",
            "updatedAt",
        ]

    def get_technicalCompliance(self, obj):
        if obj.technical_compliance is True:
            return "Compliant"
        if obj.technical_compliance is False:
            return "Non-Compliant"
        return "Pending"

    def get_quotationDocument(self, obj):
        if not obj.quotation_document:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.quotation_document.url) if request else obj.quotation_document.url

    def get_technicalDocument(self, obj):
        if not obj.technical_document:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.technical_document.url) if request else obj.technical_document.url
