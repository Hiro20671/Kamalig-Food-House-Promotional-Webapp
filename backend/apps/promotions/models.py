from django.db import models
from apps.media_management.validators import validate_image_file, optimize_uploaded_image


class Promotion(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    badge_text = models.CharField(max_length=80, blank=True, default='SPECIAL PROMO')
    image = models.ImageField(
        upload_to='promotions/',
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    button_label = models.CharField(max_length=80, default='Explore Our Menu')
    button_destination = models.CharField(max_length=200, default='/menu')
    is_published = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-updated_at']

    def save(self, *args, **kwargs):
        if self.image and hasattr(self.image, 'file'):
            self.image = optimize_uploaded_image(self.image, max_width=1400)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

