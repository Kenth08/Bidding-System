from rest_framework import serializers

from .models import Project, Procurement, AuditLog, DocumentUpload


REQUEST_STATUS_TO_API = {
    Procurement.Status.PENDING_REVIEW: "pending_review",
    Procurement.Status.APPROVED: "approved",
    Procurement.Status.REJECTED: "rejected",
    Procurement.Status.REVISION_REQUIRED: "revision_required",
}

REQUEST_STATUS_FROM_API = {value: key for key, value in REQUEST_STATUS_TO_API.items()}


class ProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    procurement_request_status = serializers.CharField(source="procurement_request.status", read_only=True)
    procurement_request_details = serializers.SerializerMethodField()
    bid_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "procurement_request",
            "procurement_request_status",
            "title",
            "budget",
            "deadline",
            "public_result_expiry_date",
            "awarded_at",
            "requirements",
            "procurement_type",
            "delivery_period",
            "technical_specifications",
            "status",
            "created_by",
            "created_by_name",
            "bid_count",
            "procurement_request_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at", "awarded_at"]

    def get_procurement_request_details(self, obj):
        if not obj.procurement_request:
            return None
        return ProcurementSerializer(obj.procurement_request, context=self.context).data

    def get_bid_count(self, obj):
        return obj.bids.count()


class ProcurementSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="project_title")
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True)
    project_title = serializers.CharField(read_only=True)

    def validate_status(self, value):
        if value in REQUEST_STATUS_FROM_API:
            return REQUEST_STATUS_FROM_API[value]
        if value in REQUEST_STATUS_TO_API:
            return value
        return Procurement.Status.PENDING_REVIEW

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["status"] = REQUEST_STATUS_TO_API.get(instance.status, "pending_review")
        data["title"] = instance.project_title
        data["project_title"] = instance.project_title
        data["review_remarks"] = instance.review_remarks or ""
        data["deadline"] = instance.deadline.isoformat() if instance.deadline else None
        data["public_result_expiry_date"] = instance.public_result_expiry_date.isoformat() if instance.public_result_expiry_date else None
        return data

    def validate(self, attrs):
        if "status" in attrs:
            attrs["status"] = self.validate_status(attrs["status"])
        return attrs

    def create(self, validated_data):
        project_title = validated_data.pop("project_title", None)
        if project_title is not None:
            validated_data["project_title"] = project_title
        return super().create(validated_data)

    def update(self, instance, validated_data):
        project_title = validated_data.pop("project_title", None)
        if project_title is not None:
            validated_data["project_title"] = project_title
        return super().update(instance, validated_data)

    class Meta:
        model = Procurement
        fields = [
            "id",
            "title",
            "project_title",
            "budget",
            "deadline",
            "public_result_expiry_date",
            "procurement_type",
            "technical_specifications",
            "procurement_schedule",
            "delivery_period",
            "status",
            "rejection_reason",
            "revision_notes",
            "review_remarks",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "reviewed_by", "reviewed_at", "created_at", "updated_at", "project_title"]


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "action",
            "user",
            "user_email",
            "user_name",
            "user_role",
            "description",
            "resource_type",
            "resource_id",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class DocumentUploadSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentUpload
        fields = [
            "id",
            "user",
            "document_type",
            "file_name",
            "file",
            "file_url",
            "file_size",
            "verification_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]

    def get_file_url(self, obj):
        if not obj.file:
            return ""
        request = self.context.get("request")
        url = obj.file.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url
