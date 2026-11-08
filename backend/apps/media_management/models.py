from django.db import models
from apps.media_management.validators import validate_image_file, optimize_uploaded_image


class MediaAsset(models.Model):
    title = models.CharField(max_length=200, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    file = models.ImageField(upload_to='uploads/%Y/%m/', validators=[validate_image_file])
    category = models.CharField(max_length=80, default='general')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.file and not self.pk:
            self.file = optimize_uploaded_image(self.file)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title or self.file.name

