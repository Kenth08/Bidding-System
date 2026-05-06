from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_default_admin_user(apps, schema_editor):
    User = apps.get_model("users", "User")

    email = getattr(settings, "DEFAULT_ADMIN_EMAIL", "admin@gmail.com")
    password = getattr(settings, "DEFAULT_ADMIN_PASSWORD", "admiin123")

    if not User.objects.filter(email=email).exists():
        User.objects.create(
            email=email,
            password=make_password(password),
            full_name="Administrator",
            role="admin",
            status="active",
            is_staff=True,
            is_active=True,
        )


def remove_default_admin_user(apps, schema_editor):
    User = apps.get_model("users", "User")
    email = getattr(settings, "DEFAULT_ADMIN_EMAIL", "admin@gmail.com")
    User.objects.filter(email=email).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_default_admin_user, remove_default_admin_user),
    ]