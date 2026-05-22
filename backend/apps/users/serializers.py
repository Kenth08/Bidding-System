from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    business_permit_document_name = serializers.SerializerMethodField()
    business_permit_document_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "role",
            "status",
            "status_display",
            "company_name",
            "company_address",
            "phone",
            "business_type",
            "business_permit_document",
            "business_permit_document_name",
            "business_permit_document_url",
            "is_staff",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_business_permit_document_name(self, obj):
        if not obj.business_permit_document:
            return ""
        return obj.business_permit_document.name.split("/")[-1]

    def get_business_permit_document_url(self, obj):
        if not obj.business_permit_document:
            return ""
        request = self.context.get("request")
        url = obj.business_permit_document.url
        return request.build_absolute_uri(url) if request else url


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    company_name = serializers.CharField(required=True, allow_blank=False)
    company_address = serializers.CharField(required=True, allow_blank=False)
    phone = serializers.CharField(required=True, allow_blank=False)
    business_type = serializers.CharField(required=True, allow_blank=False)
    business_permit_document = serializers.FileField(required=True)

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "password",
            "company_name",
            "company_address",
            "phone",
            "business_type",
            "business_permit_document",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(
            email=validated_data.get("email"),
            password=password,
            full_name=validated_data.get("full_name", ""),
            company_name=validated_data.get("company_name", ""),
            company_address=validated_data.get("company_address", ""),
            phone=validated_data.get("phone", ""),
            business_type=validated_data.get("business_type", "Other"),
            business_permit_document=validated_data.get("business_permit_document"),
            role=User.Role.SUPPLIER,
            status=User.Status.PENDING,
        )
        return user
