from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0004_add_draft_status"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="procurement_request",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="project",
                to="projects.procurement",
            ),
        ),
        migrations.AddField(
            model_name="procurement",
            name="deadline",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="procurement",
            name="status",
            field=models.CharField(
                choices=[
                    ("Pending Review", "Pending Review"),
                    ("Approved", "Approved"),
                    ("Rejected", "Rejected"),
                    ("Revision Required", "Revision Required"),
                ],
                default="Pending Review",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="procurement",
            name="rejection_reason",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="procurement",
            name="revision_notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="procurement",
            name="reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="reviewed_procurements",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="procurement",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]