from django.db import models
from django.utils.text import slugify
from apps.media_management.validators import validate_image_file, optimize_uploaded_image


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(
        upload_to='categories/',
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    display_order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or 'category'
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        if self.image and hasattr(self.image, 'file'):
            self.image = optimize_uploaded_image(self.image, max_width=1000)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

