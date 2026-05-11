from django.conf import settings
from django.db import migrations


def set_admin_is_superuser(apps, schema_editor):
    """Ensure the admin user has is_superuser=True for proper authentication."""
    User = apps.get_model("users", "User")
    email = getattr(settings, "DEFAULT_ADMIN_EMAIL", "admin@gmail.com")
    
    try:
        admin_user = User.objects.get(email=email, role="admin")
        if not admin_user.is_superuser:
            admin_user.is_superuser = True
            admin_user.save(update_fields=["is_superuser"])
    except User.DoesNotExist:
        pass


def restore_is_superuser(apps, schema_editor):
    """Reverse operation."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_user_business_permit_number"),
    ]

    operations = [
        migrations.RunPython(set_admin_is_superuser, restore_is_superuser),
    ]
