from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0005_school_head_workflow"),
    ]

    operations = [
        migrations.AddField(
            model_name="procurement",
            name="review_remarks",
            field=models.TextField(blank=True, null=True),
        ),
    ]