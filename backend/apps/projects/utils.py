from django.utils import timezone

from .models import Project


def close_expired_projects():
    """Close active projects whose deadline has passed.

    This is a lightweight utility intended to be called from view entrypoints
    to ensure projects with past deadlines are moved to `closed` state.
    """
    today = timezone.localdate()
    expired = Project.objects.filter(status=Project.Status.ACTIVE, deadline__lt=today, is_archived=False)
    if expired.exists():
        expired.update(status=Project.Status.CLOSED, updated_at=timezone.now())
