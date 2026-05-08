from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def fix_default_admin_password(apps, schema_editor):
    User = apps.get_model("users", "User")

    email = getattr(settings, "DEFAULT_ADMIN_EMAIL", "admin@gmail.com")
    password = getattr(settings, "DEFAULT_ADMIN_PASSWORD", "admin123")

    try:
        admin_user = User.objects.get(email=email)
    except User.DoesNotExist:
        return

    admin_user.password = make_password(password)
    admin_user.role = "admin"
    admin_user.status = "active"
    admin_user.is_staff = True
    admin_user.is_active = True
    admin_user.save(update_fields=["password", "role", "status", "is_staff", "is_active"])


def restore_default_admin_password(apps, schema_editor):
    User = apps.get_model("users", "User")

    email = getattr(settings, "DEFAULT_ADMIN_EMAIL", "admin@gmail.com")
    if User.objects.filter(email=email).exists():
        User.objects.filter(email=email).update(password=make_password("admiin123"))


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_seed_default_admin_user"),
    ]

    operations = [
        migrations.RunPython(fix_default_admin_password, restore_default_admin_password),
    ]