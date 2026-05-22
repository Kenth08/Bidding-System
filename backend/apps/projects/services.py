import re
from datetime import date

from django.utils import timezone

from apps.notifications.utils import create_notification

from .audit import log_audit
from .models import Procurement, Project


def get_review_block_reason(procurement):
    if procurement.status == Procurement.Status.APPROVED:
        return "This request has already been approved."
    if procurement.status == Procurement.Status.REJECTED:
        return "This request has already been rejected."
    return None


def _parse_date(value):
    if value in (None, ""):
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None
    return None


def _parse_delivery_period(value):
    if value in (None, ""):
        return 0
    if isinstance(value, int):
        return value
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else 0


def _sync_project_from_procurement(procurement):
    project_defaults = {
        "title": procurement.project_title,
        "budget": procurement.budget,
        "deadline": procurement.deadline,
        "procurement_schedule": _parse_date(procurement.procurement_schedule),
        "public_result_expiry_date": procurement.public_result_expiry_date,
        "requirements": procurement.technical_specifications,
        "procurement_type": procurement.procurement_type,
        "delivery_period": _parse_delivery_period(procurement.delivery_period),
        "technical_specifications": procurement.technical_specifications,
        "status": Project.Status.DRAFT,
        "created_by": procurement.created_by,
    }

    project = Project.objects.filter(procurement_request=procurement).first()
    if project is None:
        project = Project(procurement_request=procurement, **project_defaults)
    else:
        for field_name, field_value in project_defaults.items():
            setattr(project, field_name, field_value)

    project.save()
    return project


def apply_review_action(procurement, action, remarks, user):
    action = str(action).strip().lower()
    remarks = str(remarks or "").strip()

    if action not in {"approved", "rejected", "revision_required"}:
        raise ValueError("Invalid review action.")

    procurement.reviewed_by = user
    procurement.reviewed_at = timezone.now()
    procurement.review_remarks = remarks

    if action == "approved":
        procurement.status = Procurement.Status.APPROVED
        procurement.rejection_reason = ""
        procurement.revision_notes = ""
        project = _sync_project_from_procurement(procurement)
    elif action == "rejected":
        procurement.status = Procurement.Status.REJECTED
        procurement.rejection_reason = remarks
        procurement.revision_notes = ""
        project = None
    else:
        procurement.status = Procurement.Status.REVISION_REQUIRED
        procurement.revision_notes = remarks
        procurement.rejection_reason = ""
        project = None

    procurement.save()
    return {"request": procurement, "project": project}


def publish_project(project, user=None, scheduled=False):
    project.status = Project.Status.ACTIVE
    project.published_at = timezone.now()
    project.save(update_fields=["status", "published_at", "updated_at"])

    if user is not None:
        log_audit(
            "UPDATE",
            user,
            f"Published project {project.title}{' on schedule' if scheduled else ''}",
            "project",
            project.id,
        )

    return project


def archive_project(project, user=None, reason="Archived by admin"):
    project.is_archived = True
    project.archived_at = timezone.now()
    project.archived_reason = reason or "Archived by admin"
    project.save(update_fields=["is_archived", "archived_at", "archived_reason", "updated_at"])

    if user is not None:
        log_audit("UPDATE", user, f"Archived project {project.title}", "project", project.id)

    return project


def unarchive_project(project):
    project.is_archived = False
    project.archived_at = None
    project.archived_reason = None
    project.save(update_fields=["is_archived", "archived_at", "archived_reason", "updated_at"])
    return project


def notify_request_review(procurement, reviewer, review_status, message):
    recipient = procurement.created_by
    if recipient is None:
        return None

    notification_type = "request_approved" if review_status == "approved" else "request_rejected"
    title = "Procurement Request Approved" if review_status == "approved" else "Procurement Request Rejected"
    link = "/school-head/requests"

    return create_notification(
        recipient,
        notification_type,
        title,
        message,
        link=link,
        related_id=str(procurement.id),
    )