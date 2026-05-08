# Generated manually to add Draft status and change default
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_remove_documentupload_file_path_documentupload_file_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="status",
            field=models.CharField(choices=[('draft', 'Draft'), ('active', 'Active'), ('closed', 'Closed'), ('awarded', 'Awarded')], default='draft', max_length=20),
        ),
    ]
