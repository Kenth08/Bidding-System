from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission

User = get_user_model()


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)


class IsSchoolHead(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.SCHOOL_HEAD)


class IsAdminOrSchoolHead(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {User.Role.ADMIN, User.Role.SCHOOL_HEAD}
        )


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in {"GET", "HEAD", "OPTIONS"}:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)


class IsSupplier(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.SUPPLIER
            and request.user.status in {User.Status.ACTIVE, User.Status.APPROVED}
        )
