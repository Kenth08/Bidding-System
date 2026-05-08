from rest_framework import serializers

from .models import Project, Procurement, AuditLog, DocumentUpload


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "budget",
            "deadline",
            "requirements",
            "procurement_type",
            "delivery_period",
            "technical_specifications",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]


class ProcurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Procurement
        fields = [
            "id",
            "project_title",
            "budget",
            "procurement_type",
            "technical_specifications",
            "procurement_schedule",
            "delivery_period",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]


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
