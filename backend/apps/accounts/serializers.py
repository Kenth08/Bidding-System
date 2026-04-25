from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        if full_name:
            return full_name
        return obj.user.username

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            profile = getattr(user, "profile", None)
            if profile and profile.role == Profile.Role.SUPPLIER:
                self.fields["status"].read_only = True

    def validate_status(self, value):
        normalized = str(value).strip().lower()
        allowed = {
            Profile.Status.PENDING,
            Profile.Status.APPROVED,
            Profile.Status.REJECTED,
        }
        if normalized not in allowed:
            raise serializers.ValidationError("Invalid status value.")
        return normalized

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["status"] = instance.get_status_display()
        return data

    class Meta:
        model = Profile
        fields = [
            "id",
            "full_name",
            "email",
            "username",
            "role",
            "status",
            "company_name",
            "company_address",
            "phone",
            "business_type",
            "created_at",
            "updated_at",
        ]
