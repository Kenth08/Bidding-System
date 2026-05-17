from apps.users.models import User

from .models import Notification


def create_notification(recipient, type, title, message, link=None, related_id=None):
    return Notification.objects.create(
        recipient=recipient,
        type=type,
        title=title,
        message=message,
        link=link,
        related_id=related_id,
    )


def notify_admins(notification_type, title, message, link=None, related_id=None):
    admins = User.objects.filter(role="admin", is_active=True)
    for admin in admins:
        create_notification(admin, notification_type, title, message, link=link, related_id=related_id)


def notify_school_heads(notification_type, title, message, link=None, related_id=None):
    heads = User.objects.filter(role="school_head", is_active=True)
    for head in heads:
        create_notification(head, notification_type, title, message, link=link, related_id=related_id)


def notify_all_approved_suppliers(notification_type, title, message, link=None, related_id=None):
    suppliers = User.objects.filter(role="supplier", status="approved", is_active=True)
    for supplier in suppliers:
        create_notification(supplier, notification_type, title, message, link=link, related_id=related_id)


def notify_user(user, notification_type, title, message, link=None, related_id=None):
    create_notification(user, notification_type, title, message, link=link, related_id=related_id)
