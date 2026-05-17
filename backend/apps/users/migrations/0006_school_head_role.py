from django.db import migrations, models
from django.contrib.auth.hashers import make_password


def seed_school_head(apps, schema_editor):
    User = apps.get_model("users", "User")
    if not User.objects.filter(email="head@gmail.com").exists():
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


def unseed_school_head(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(email="head@gmail.com").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0005_fix_admin_is_superuser"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Admin"),
                    ("school_head", "School Head"),
                    ("supplier", "Supplier"),
                    ("viewer", "Viewer"),
                ],
                default="supplier",
                max_length=20,
            ),
        ),
        migrations.RunPython(seed_school_head, unseed_school_head),
    ]