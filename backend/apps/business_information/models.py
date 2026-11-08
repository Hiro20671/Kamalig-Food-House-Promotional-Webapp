from django.db import models
from django.utils import timezone


class BusinessInformation(models.Model):
    business_name = models.CharField(max_length=160, default='Kamalig Food House')
    address = models.CharField(
        max_length=255,
        default='130 CCF Village, Brgy. Mayao Parada, Lucena City',
    )
    phone = models.CharField(max_length=60, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    facebook_url = models.URLField(blank=True, default='')
    facebook_page_name = models.CharField(max_length=120, blank=True, default='Kamalig Food House')
    messenger_url = models.URLField(blank=True, default='')
    other_social_links = models.JSONField(default=list, blank=True)
    operating_hours = models.CharField(
        max_length=255,
        blank=True,
        default='',
    )
    contact_instructions = models.TextField(
        blank=True,
        default='Visit us at our store in Brgy. Mayao Parada, Lucena City or reach out through our official channels.',
    )

    # Visibility toggles
    show_phone = models.BooleanField(default=True)
    show_email = models.BooleanField(default=True)
    show_facebook = models.BooleanField(default=True)
    show_messenger = models.BooleanField(default=True)
    show_address = models.BooleanField(default=True)
    show_operating_hours = models.BooleanField(default=True)

    # Draft & Publish workflow
    draft_data = models.JSONField(default=dict, blank=True)
    has_unpublished_changes = models.BooleanField(default=False)
    last_published_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Business Information'

    def __str__(self):
        return self.business_name

