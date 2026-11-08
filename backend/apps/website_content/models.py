from django.db import models
from django.utils import timezone
from apps.media_management.validators import validate_image_file, optimize_uploaded_image


def default_why_choose_items():
    return [
        {
            'id': 'delicious-food',
            'icon': 'Utensils',
            'title': 'Delicious Food',
            'description': 'Freshly cooked silog rice meals, savory short orders, burgers, and classic comfort favorites prepared with care.',
            'is_visible': True,
        },
        {
            'id': 'refreshing-drinks',
            'icon': 'CupSoda',
            'title': 'Refreshing Drinks',
            'description': 'Cool down with fruity Soda Pop, creamy Yakult Mix, Snack Time combos, and Kape-Malig coffee creations.',
            'is_visible': True,
        },
        {
            'id': 'affordable-prices',
            'icon': 'Sparkles',
            'title': 'Affordable Prices',
            'description': 'True to our promise — Sarap na Abot-Kaya! Enjoy generous servings at everyday budget-friendly prices.',
            'is_visible': True,
        },
    ]


def default_section_order():
    return [
        'hero',
        'featured',
        'best_sellers',
        'promotions',
        'why_choose',
        'about_preview',
        'location_preview',
    ]


def default_why_visit_items():
    return [
        {
            'title': 'All-Day Comfort Cravings',
            'description': 'From classic silog meals and sizzling sisig to pancit, lomi, burgers, and snacks.',
        },
        {
            'title': 'Signature Drinks & Coffee',
            'description': 'Wide variety of Soda Pop flavors, Yakult Mixes, Snack Time cup combos, and Kape-Malig brews.',
        },
        {
            'title': 'Sarap na Abot-Kaya',
            'description': 'Quality food house experience designed to be accessible and welcoming for students, families, and friends.',
        },
    ]


class HomepageContent(models.Model):
    # Hero Section
    hero_title = models.CharField(max_length=200, default='Good Food, Great Mood!')
    hero_subtitle = models.CharField(max_length=200, default='Sarap na Abot-Kaya!')
    hero_description = models.TextField(
        default='Welcome to Kamalig Food House — your neighborhood destination in Lucena City for hearty silog meals, flavorful short orders, burgers, snacks, and refreshing drinks.'
    )
    hero_background_image = models.ImageField(
        upload_to='homepage/',
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    hero_featured_image = models.ImageField(
        upload_to='homepage/',
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    primary_button_label = models.CharField(max_length=80, default='Explore Our Menu')
    primary_button_destination = models.CharField(max_length=150, default='/menu')
    secondary_button_label = models.CharField(max_length=80, default='Find Our Location')
    secondary_button_destination = models.CharField(max_length=150, default='/location')

    # Hero element visibility toggles
    show_hero = models.BooleanField(default=True)
    show_hero_subtitle = models.BooleanField(default=True)
    show_hero_description = models.BooleanField(default=True)
    show_primary_button = models.BooleanField(default=True)
    show_secondary_button = models.BooleanField(default=True)

    # Featured Products section
    show_featured_section = models.BooleanField(default=True)
    featured_section_title = models.CharField(max_length=160, default='Featured Favorites')
    featured_section_subtitle = models.CharField(
        max_length=255,
        default='Handpicked meals, snacks, and drinks from the Kamalig kitchen.',
    )

    # Best Sellers section
    show_best_sellers_section = models.BooleanField(default=True)
    best_sellers_title = models.CharField(max_length=160, default='Crowd Best Sellers')
    best_sellers_subtitle = models.CharField(
        max_length=255,
        default='Customer-loved picks selected by Kamalig Food House.',
    )

    # Promotional Banner section
    show_promo_section = models.BooleanField(default=True)

    # Why Choose Kamalig section
    show_why_choose_section = models.BooleanField(default=True)
    why_choose_title = models.CharField(max_length=160, default='Why Choose Kamalig?')
    why_choose_subtitle = models.CharField(
        max_length=255,
        default='Great taste, refreshing variety, and prices that make you smile.',
    )
    why_choose_items = models.JSONField(default=default_why_choose_items, blank=True)

    # Homepage About Preview
    show_about_preview = models.BooleanField(default=True)
    about_preview_title = models.CharField(max_length=160, default='Experience Kamalig Food House')
    about_preview_description = models.TextField(
        default='At Kamalig Food House, we bring people together over satisfying rice meals, flavorful pancit and lomi, crispy snacks, and ice-cold drinks — always serving Good Food, Great Mood!'
    )
    about_preview_button_label = models.CharField(max_length=80, default='Read Our Story')

    # Homepage Location Preview
    show_location_preview = models.BooleanField(default=True)
    location_preview_title = models.CharField(max_length=160, default='Visit Us in Lucena City')
    location_preview_subtitle = models.CharField(
        max_length=255,
        default='Drop by 130 CCF Village, Brgy. Mayao Parada, Lucena City and enjoy freshly prepared meals.',
    )
    location_preview_button_label = models.CharField(max_length=80, default='Get Directions')

    # Section Ordering
    section_order = models.JSONField(default=default_section_order, blank=True)

    # Draft & Publish workflow
    draft_data = models.JSONField(default=dict, blank=True)
    has_unpublished_changes = models.BooleanField(default=False)
    last_published_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.hero_background_image and hasattr(self.hero_background_image, 'file'):
            self.hero_background_image = optimize_uploaded_image(self.hero_background_image, max_width=1600)
        if self.hero_featured_image and hasattr(self.hero_featured_image, 'file'):
            self.hero_featured_image = optimize_uploaded_image(self.hero_featured_image, max_width=1200)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Homepage Content ({self.hero_title})"


class AboutContent(models.Model):
    title = models.CharField(max_length=180, default='About Kamalig Food House')
    subtitle = models.CharField(max_length=220, default='Good Food, Great Mood! • Sarap na Abot-Kaya!')
    introduction = models.TextField(
        default='Kamalig Food House is a welcoming local food house located at 130 CCF Village, Brgy. Mayao Parada, Lucena City, dedicated to serving hearty rice meals, short orders, burgers, snacks, refreshing drinks, and coffee at budget-friendly prices.'
    )

    # Story, Mission, Vision (kept empty/hidden until owner provides content, per prompt rules!)
    story_heading = models.CharField(max_length=150, default='Our Story')
    business_story = models.TextField(blank=True, default='')
    show_story = models.BooleanField(default=False)

    mission_heading = models.CharField(max_length=150, default='Our Mission')
    mission = models.TextField(blank=True, default='')
    show_mission = models.BooleanField(default=False)

    vision_heading = models.CharField(max_length=150, default='Our Vision')
    vision = models.TextField(blank=True, default='')
    show_vision = models.BooleanField(default=False)

    # Brand Identity & Why Visit
    brand_identity_heading = models.CharField(max_length=150, default='Our Brand Identity')
    brand_identity_text = models.TextField(
        default='Built around our signature tagline "Good Food, Great Mood!" and "Sarap na Abot-Kaya!", Kamalig Food House pairs vibrant golden warmth with deep navy sophistication to celebrate everyday dining.'
    )
    show_brand_identity = models.BooleanField(default=True)

    why_visit_heading = models.CharField(max_length=160, default='Why Visit Kamalig Food House?')
    why_visit_items = models.JSONField(default=default_why_visit_items, blank=True)
    show_why_visit = models.BooleanField(default=True)

    gallery_heading = models.CharField(max_length=160, default='Inside Kamalig Food House')
    show_gallery = models.BooleanField(default=True)

    # Draft & Publish workflow
    draft_data = models.JSONField(default=dict, blank=True)
    has_unpublished_changes = models.BooleanField(default=False)
    last_published_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class AboutImage(models.Model):
    about = models.ForeignKey(
        AboutContent,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image = models.ImageField(
        upload_to='about/',
        validators=[validate_image_file],
    )
    caption = models.CharField(max_length=200, blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'id']

    def save(self, *args, **kwargs):
        if self.image and hasattr(self.image, 'file'):
            self.image = optimize_uploaded_image(self.image, max_width=1400)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.caption or f"About Image #{self.id}"


class WebsiteSettings(models.Model):
    business_name = models.CharField(max_length=160, default='Kamalig Food House')
    tagline = models.CharField(max_length=160, default='Good Food, Great Mood!')
    supporting_tagline = models.CharField(max_length=160, default='Sarap na Abot-Kaya!')
    logo = models.ImageField(
        upload_to='branding/',
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    favicon = models.ImageField(
        upload_to='branding/',
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    og_image = models.ImageField(
        upload_to='branding/',
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    browser_title = models.CharField(
        max_length=200,
        default='Kamalig Food House | Good Food, Great Mood! – Sarap na Abot-Kaya!',
    )
    seo_description = models.TextField(
        default='Official digital storefront and menu of Kamalig Food House at 130 CCF Village, Brgy. Mayao Parada, Lucena City. Browse our silog rice meals, short orders, burgers, snacks, Soda Pop, Yakult Mix, Snack Time, and Kape-Malig coffee.'
    )
    seo_keywords = models.CharField(
        max_length=255,
        blank=True,
        default='Kamalig Food House, Lucena City food house, Mayao Parada restaurant, silog meals, Kape-Malig, Sarap na Abot-Kaya',
    )

    # Brand Colors
    primary_navy = models.CharField(max_length=20, default='#101C28')
    dark_charcoal = models.CharField(max_length=20, default='#171B20')
    golden_yellow = models.CharField(max_length=20, default='#F6C928')
    bright_yellow = models.CharField(max_length=20, default='#FFD83D')
    warm_cream = models.CharField(max_length=20, default='#FFF1C6')
    cyan_blue = models.CharField(max_length=20, default='#23C7DF')
    accent_orange = models.CharField(max_length=20, default='#F28A32')
    accent_pink = models.CharField(max_length=20, default='#F06BA6')

    footer_text = models.TextField(
        default='Your friendly neighborhood food house in Lucena City serving freshly cooked meals, snacks, and refreshing drinks.'
    )
    copyright_text = models.CharField(
        max_length=200,
        default='© 2026 Kamalig Food House. All rights reserved.',
    )
    owner_access_code = models.CharField(
        max_length=10,
        default='1830',
        help_text='4-digit security code required before showing the Owner Login form.',
    )

    # Draft & Publish workflow
    draft_data = models.JSONField(default=dict, blank=True)
    has_unpublished_changes = models.BooleanField(default=False)
    last_published_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Website Settings'

    def save(self, *args, **kwargs):
        if self.logo and hasattr(self.logo, 'file'):
            self.logo = optimize_uploaded_image(self.logo, max_width=600)
        if self.og_image and hasattr(self.og_image, 'file'):
            self.og_image = optimize_uploaded_image(self.og_image, max_width=1200)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.business_name

