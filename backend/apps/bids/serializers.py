from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Bid

User = get_user_model()


class BidSerializer(serializers.ModelSerializer):
    projectTitle = serializers.CharField(source="project.title", read_only=True)
    projectName = serializers.CharField(source="project.title", read_only=True)
    projectDeadline = serializers.DateField(source="project.deadline", read_only=True)
    projectStatus = serializers.CharField(source="project.status", read_only=True)
    projectBudget = serializers.DecimalField(source="project.budget", max_digits=15, decimal_places=2, read_only=True)
    projectProcurementType = serializers.CharField(source="project.procurement_type", read_only=True)
    projectTechnicalSpecifications = serializers.CharField(source="project.technical_specifications", read_only=True)
    projectDeliveryPeriod = serializers.IntegerField(source="project.delivery_period", read_only=True)
    projectBidCount = serializers.SerializerMethodField()
    supplierName = serializers.CharField(source="supplier.full_name", read_only=True)
    supplierCompany = serializers.CharField(source="supplier.company_name", read_only=True)
    companyName = serializers.CharField(source="company_name", read_only=True)
    bidAmount = serializers.DecimalField(source="bid_amount", max_digits=15, decimal_places=2, read_only=True)
    submittedAt = serializers.DateTimeField(source="submitted_at", format="%Y-%m-%d %H:%M:%S", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", format="%Y-%m-%d", read_only=True)
    technicalCompliance = serializers.SerializerMethodField()
    quotationDocument = serializers.SerializerMethodField()
    technicalDocument = serializers.SerializerMethodField()
    quotationFile = serializers.SerializerMethodField()
    technicalProposal = serializers.SerializerMethodField()
    supportingDocuments = serializers.SerializerMethodField()
    awardedWinnerName = serializers.SerializerMethodField()
    awardedWinnerCompany = serializers.SerializerMethodField()

    class Meta:
        model = Bid
        fields = [
            "id",
            "project",
            "projectTitle",
            "projectName",
            "projectDeadline",
            "projectStatus",
            "projectBudget",
            "projectProcurementType",
            "projectTechnicalSpecifications",
            "projectDeliveryPeriod",
            "projectBidCount",
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
            "quotation_file",
            "quotationFile",
            "technical_proposal",
            "technicalProposal",
            "supporting_documents",
            "supportingDocuments",
            "awardedWinnerName",
            "awardedWinnerCompany",
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

    def validate_bid_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Bid amount must be greater than 0.")
        return value

    def validate(self, attrs):
        if self.instance is None:
            quotation_file = attrs.get("quotation_file") or self.initial_data.get("quotation_file") or self.initial_data.get("quotationDocument")
            if not quotation_file:
                raise serializers.ValidationError({"quotation_file": "Quotation file is required."})
        return attrs

    def get_technicalCompliance(self, obj):
        if obj.technical_compliance is True:
            return "Compliant"
        if obj.technical_compliance is False:
            return "Non-Compliant"
        return "Pending"

    def get_quotationDocument(self, obj):
        return self._build_file_url(obj.quotation_document)

    def get_technicalDocument(self, obj):
        return self._build_file_url(obj.technical_document)

    def get_quotationFile(self, obj):
        return self._build_file_url(obj.quotation_file or obj.quotation_document)

    def get_technicalProposal(self, obj):
        return self._build_file_url(obj.technical_proposal or obj.technical_document)

    def get_supportingDocuments(self, obj):
        return self._build_file_url(obj.supporting_documents)

    def get_projectBidCount(self, obj):
        return obj.project.bids.count() if obj.project_id else 0

    def get_awardedWinnerName(self, obj):
        if not obj.project_id:
            return ""
        winner_bid = obj.project.bids.filter(status=Bid.Status.WON).select_related("supplier").first()
        if not winner_bid:
            return ""
        return winner_bid.supplier.full_name if winner_bid.supplier else winner_bid.company_name

    def get_awardedWinnerCompany(self, obj):
        if not obj.project_id:
            return ""
        winner_bid = obj.project.bids.filter(status=Bid.Status.WON).select_related("supplier").first()
        if not winner_bid:
            return ""
        if winner_bid.supplier and winner_bid.supplier.company_name:
            return winner_bid.supplier.company_name
        return winner_bid.company_name or ""

    def _build_file_url(self, field_file):
        if not field_file:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(field_file.url) if request else field_file.url
