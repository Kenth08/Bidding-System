from django.db import migrations
from django.contrib.auth.hashers import make_password


def ensure_school_head(apps, schema_editor):
    User = apps.get_model("users", "User")
    if not User.objects.filter(email__iexact="head@gmail.com").exists():
        user = User(
            full_name="School Head",
            email="head@gmail.com",
            role="school_head",
            status="active",
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )
        user.password = make_password("head123")
        user.save()


def reverse_func(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(email__iexact="head@gmail.com").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_school_head_role"),
    ]

    operations = [
        migrations.RunPython(ensure_school_head, reverse_func),
    ]
