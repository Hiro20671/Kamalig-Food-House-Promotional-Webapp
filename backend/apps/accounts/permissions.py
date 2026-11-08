from rest_framework.permissions import BasePermission


class IsOwnerOrAdmin(BasePermission):
    """
    Allows access only to authenticated staff/owner/admin users.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        profile = getattr(request.user, 'account_profile', None)
        return bool(profile and profile.role in ('OWNER', 'ADMIN'))

