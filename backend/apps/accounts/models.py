from django.db import models
from django.contrib.auth.models import User


class Account(models.Model):
    ROLE_CHOICES = (
        ('OWNER', 'Owner (Full Access)'),
        ('ADMIN', 'Authorized Administrator'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='account_profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='OWNER')
    permissions = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    username = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=100)
    section = models.CharField(max_length=100)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {self.username} - {self.section}: {self.action}"


def log_audit(user, section, action, summary=""):
    username = user.username if user and user.is_authenticated else "owner"
    AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        username=username,
        section=section,
        action=action,
        summary=summary,
    )

