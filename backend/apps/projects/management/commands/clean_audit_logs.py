from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.projects.models import AuditLog


class Command(BaseCommand):
    help = "Delete audit logs older than 30 days"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=30,
            help="Number of days to keep (default: 30)",
        )

    def handle(self, *args, **options):
        days = options.get("days", 30)
        cutoff = timezone.now() - timedelta(days=days)
        qs = AuditLog.objects.filter(created_at__lt=cutoff)
        count = qs.count()
        qs.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} audit log(s) older than {days} days."))
