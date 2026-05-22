from django.utils import timezone

from apps.projects.audit import log_audit

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


def auto_publish_scheduled_projects(actor=None):
    today = timezone.now().date()
    scheduled = Project.objects.filter(
        status=Project.Status.DRAFT,
        procurement_schedule__lte=today,
        is_archived=False,
    )

    for project in scheduled:
        project.status = Project.Status.ACTIVE
        project.published_at = timezone.now()
        project.save(update_fields=["status", "published_at", "updated_at"])
        log_audit("UPDATE", actor, f"Published project {project.title} on scheduled date", "project", project.id)
