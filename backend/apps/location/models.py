from django.db import models
from django.utils import timezone


class BusinessLocation(models.Model):
    business_name = models.CharField(max_length=160, default='Kamalig Food House')
    address = models.CharField(
        max_length=255,
        default='130 CCF Village, Brgy. Mayao Parada, Lucena City',
    )
    latitude = models.FloatField(default=13.9412)
    longitude = models.FloatField(default=121.6445)
    map_zoom = models.IntegerField(default=16)
    nearby_landmarks = models.TextField(
        blank=True,
        default='',
    )
    directions_information = models.TextField(
        blank=True,
        default='Located at 130 CCF Village, Brgy. Mayao Parada, Lucena City. Click "Get Directions to Kamalig" to view the live route from your location.',
    )
    business_hours = models.CharField(
        max_length=255,
        blank=True,
        default='',
    )
    google_maps_url = models.URLField(blank=True, default='')

    # Draft & Publish workflow
    draft_data = models.JSONField(default=dict, blank=True)
    has_unpublished_changes = models.BooleanField(default=False)
    last_published_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Business Locations'

    def __str__(self):
        return f"{self.business_name} - {self.address}"

