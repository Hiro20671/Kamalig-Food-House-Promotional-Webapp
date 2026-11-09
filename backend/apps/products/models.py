from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from apps.categories.models import Category
from apps.media_management.validators import validate_image_file, optimize_uploaded_image


class Product(models.Model):
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='products',
    )
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_note = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional note (e.g., '12 oz - 22 oz' or 'Price varies by size')",
    )
    main_image = models.ImageField(
        upload_to='products/main/',
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    is_featured = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    sold_out_date = models.DateField(
        null=True,
        blank=True,
        help_text='If set to today (Asia/Manila), this product is marked Sold Out for today only and automatically resets to available tomorrow.',
    )
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']

    @property
    def is_sold_out_today(self):
        if not self.sold_out_date:
            return False
        return self.sold_out_date == timezone.localdate()

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or 'product'
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        if self.main_image and hasattr(self.main_image, 'file'):
            self.main_image = optimize_uploaded_image(self.main_image, max_width=1200)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image = models.ImageField(
        upload_to='products/gallery/',
        validators=[validate_image_file],
    )
    alt_text = models.CharField(max_length=200, blank=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'id']

    def save(self, *args, **kwargs):
        if self.image and hasattr(self.image, 'file'):
            self.image = optimize_uploaded_image(self.image, max_width=1200)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.product.name}"


class ProductVariant(models.Model):
    VARIANT_GROUP_CHOICES = (
        ('Size', 'Size'),
        ('Flavor', 'Flavor'),
        ('Topping', 'Topping'),
        ('Option', 'Option'),
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants',
    )
    variant_group = models.CharField(max_length=40, choices=VARIANT_GROUP_CHOICES, default='Option')
    variant_name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['variant_group', 'display_order', 'id']

    def __str__(self):
        price_str = f" - ₱{self.price}" if self.price is not None else ""
        return f"{self.product.name}: [{self.variant_group}] {self.variant_name}{price_str}"

