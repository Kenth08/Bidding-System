from django.db import migrations, models


def normalize_status_values(apps, schema_editor):
    Profile = apps.get_model("accounts", "Profile")
    mapping = {
        "Pending": "pending",
        "Approved": "approved",
        "Rejected": "rejected",
        "Active": "approved",
        "pending": "pending",
        "approved": "approved",
        "rejected": "rejected",
    }

    for profile in Profile.objects.all().only("id", "status"):
        normalized = mapping.get(profile.status, "pending")
        if profile.status != normalized:
            profile.status = normalized
            profile.save(update_fields=["status"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="status",
            field=models.CharField(
                choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.RunPython(normalize_status_values, migrations.RunPython.noop),
    ]
