# Generated manually to align the notification schema with the updated model.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_notification_resource_id_notification_resource_type"),
    ]

    operations = [
        migrations.RenameField(
            model_name="notification",
            old_name="notification_type",
            new_name="type",
        ),
        migrations.AddField(
            model_name="notification",
            name="link",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="notification",
            name="related_id",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]
