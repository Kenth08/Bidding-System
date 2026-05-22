# Generated migration to add published_at to Project

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0010_add_procurement_schedule"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="published_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]