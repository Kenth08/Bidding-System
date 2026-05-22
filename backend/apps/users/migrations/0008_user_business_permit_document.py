from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_ensure_school_head"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="business_permit_document",
            field=models.FileField(blank=True, null=True, upload_to="uploads/permits/"),
        ),
    ]