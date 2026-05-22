from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0008_user_business_permit_document"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="business_permit_number",
        ),
    ]