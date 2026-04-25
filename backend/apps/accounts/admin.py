from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "status", "company_name", "created_at")
    list_filter = ("role", "status", "created_at")
    search_fields = ("user__email", "user__username", "company_name")
