# c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\backend\apps\projects\audit.py
from apps.projects.models import AuditLog


def log_audit(action, user=None, description="", resource_type="", resource_id=""):
    if not user or not getattr(user, "is_authenticated", False):
        user = None

    try:
        AuditLog.objects.create(
            action=action,
            user=user,
            description=description,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else "",
        )
    except Exception:
        return None