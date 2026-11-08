from rest_framework import serializers
from apps.website_content.models import (
    HomepageContent,
    AboutContent,
    AboutImage,
    WebsiteSettings,
)


class HomepageContentSerializer(serializers.ModelSerializer):
    hero_background_image_url = serializers.SerializerMethodField()
    hero_featured_image_url = serializers.SerializerMethodField()
    remove_hero_background_image = serializers.BooleanField(write_only=True, required=False, default=False)
    remove_hero_featured_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = HomepageContent
        fields = [
            'id',
            'hero_title',
            'hero_subtitle',
            'hero_description',
            'hero_background_image',
            'hero_background_image_url',
            'remove_hero_background_image',
            'hero_featured_image',
            'hero_featured_image_url',
            'remove_hero_featured_image',
            'primary_button_label',
            'primary_button_destination',
            'secondary_button_label',
            'secondary_button_destination',
            'show_hero',
            'show_hero_subtitle',
            'show_hero_description',
            'show_primary_button',
            'show_secondary_button',
            'show_featured_section',
            'featured_section_title',
            'featured_section_subtitle',
            'show_best_sellers_section',
            'best_sellers_title',
            'best_sellers_subtitle',
            'show_promo_section',
            'show_why_choose_section',
            'why_choose_title',
            'why_choose_subtitle',
            'why_choose_items',
            'show_about_preview',
            'about_preview_title',
            'about_preview_description',
            'about_preview_button_label',
            'show_location_preview',
            'location_preview_title',
            'location_preview_subtitle',
            'location_preview_button_label',
            'section_order',
            'draft_data',
            'has_unpublished_changes',
            'last_published_at',
            'updated_at',
        ]

    def _build_url(self, image_field):
        if not image_field:
            return None
        return image_field.url

    def get_hero_background_image_url(self, obj):
        return self._build_url(obj.hero_background_image)

    def get_hero_featured_image_url(self, obj):
        return self._build_url(obj.hero_featured_image)

    def update(self, instance, validated_data):
        if validated_data.pop('remove_hero_background_image', False) and instance.hero_background_image:
            instance.hero_background_image.delete(save=False)
            instance.hero_background_image = None
        if validated_data.pop('remove_hero_featured_image', False) and instance.hero_featured_image:
            instance.hero_featured_image.delete(save=False)
            instance.hero_featured_image = None
        return super().update(instance, validated_data)


class AboutImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AboutImage
        fields = ['id', 'about', 'image', 'image_url', 'caption', 'alt_text', 'display_order', 'created_at']
        read_only_fields = ['about']

    def get_image_url(self, obj):
        if not obj.image:
            return None
        return obj.image.url


class AboutContentSerializer(serializers.ModelSerializer):
    images = AboutImageSerializer(many=True, read_only=True)

    class Meta:
        model = AboutContent
        fields = [
            'id',
            'title',
            'subtitle',
            'introduction',
            'story_heading',
            'business_story',
            'show_story',
            'mission_heading',
            'mission',
            'show_mission',
            'vision_heading',
            'vision',
            'show_vision',
            'brand_identity_heading',
            'brand_identity_text',
            'show_brand_identity',
            'why_visit_heading',
            'why_visit_items',
            'show_why_visit',
            'gallery_heading',
            'show_gallery',
            'images',
            'draft_data',
            'has_unpublished_changes',
            'last_published_at',
            'updated_at',
        ]


class WebsiteSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()
    remove_logo = serializers.BooleanField(write_only=True, required=False, default=False)
    remove_favicon = serializers.BooleanField(write_only=True, required=False, default=False)
    remove_og_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = WebsiteSettings
        fields = [
            'id',
            'business_name',
            'tagline',
            'supporting_tagline',
            'logo',
            'logo_url',
            'remove_logo',
            'favicon',
            'favicon_url',
            'remove_favicon',
            'og_image',
            'og_image_url',
            'remove_og_image',
            'browser_title',
            'seo_description',
            'seo_keywords',
            'primary_navy',
            'dark_charcoal',
            'golden_yellow',
            'bright_yellow',
            'warm_cream',
            'cyan_blue',
            'accent_orange',
            'accent_pink',
            'footer_text',
            'copyright_text',
            'owner_access_code',
            'draft_data',
            'has_unpublished_changes',
            'last_published_at',
            'updated_at',
        ]
        extra_kwargs = {
            'owner_access_code': {'write_only': True, 'required': False},
        }

    def _build_url(self, image_field):
        if not image_field:
            return None
        return image_field.url

    def get_logo_url(self, obj):
        return self._build_url(obj.logo)

    def get_favicon_url(self, obj):
        return self._build_url(obj.favicon)

    def get_og_image_url(self, obj):
        return self._build_url(obj.og_image)

    def update(self, instance, validated_data):
        if validated_data.pop('remove_logo', False) and instance.logo:
            instance.logo.delete(save=False)
            instance.logo = None
        if validated_data.pop('remove_favicon', False) and instance.favicon:
            instance.favicon.delete(save=False)
            instance.favicon = None
        if validated_data.pop('remove_og_image', False) and instance.og_image:
            instance.og_image.delete(save=False)
            instance.og_image = None
        return super().update(instance, validated_data)

