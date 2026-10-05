"""Role-based authorization for the public API and its CMS operations."""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from core_app.models import User


def _has_role(user, roles):
    return bool(
        user.is_authenticated
        and user.is_active
        and (user.is_superuser or user.role in roles)
    )


class IsContentEditorOrReadOnly(BasePermission):
    """Keep public reads while restricting content writes to its managers."""

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or _has_role(
            request.user, (User.ROLE_EDITOR, User.ROLE_ADMIN)
        )


class IsRoleAdmin(BasePermission):
    """Allow administrators and superusers, without treating staff as a role."""

    def has_permission(self, request, view):
        return _has_role(request.user, (User.ROLE_ADMIN,))


class IsRoleAdminOrReadOnly(IsRoleAdmin):
    """Expose public singleton/status reads with administrator-only writes."""

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or super().has_permission(request, view)
