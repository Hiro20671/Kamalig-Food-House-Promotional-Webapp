import json
from django.utils import timezone
from rest_framework import serializers
from apps.products.models import Product, ProductImage, ProductVariant


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image', 'image_url', 'alt_text', 'display_order', 'created_at']
        read_only_fields = ['product']

    def get_image_url(self, obj):
        if not obj.image:
            return None
        return obj.image.url


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'variant_group', 'variant_name', 'price', 'is_available', 'display_order']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    main_image_url = serializers.SerializerMethodField()
    is_sold_out_today = serializers.SerializerMethodField()
    mark_sold_out_today = serializers.BooleanField(
        write_only=True,
        required=False,
        allow_null=True,
        default=None,
    )
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    variants_payload = serializers.CharField(write_only=True, required=False, allow_blank=True)
    remove_main_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'category_name',
            'category_slug',
            'description',
            'price',
            'price_note',
            'main_image',
            'main_image_url',
            'remove_main_image',
            'is_featured',
            'is_best_seller',
            'is_published',
            'is_archived',
            'sold_out_date',
            'is_sold_out_today',
            'mark_sold_out_today',
            'display_order',
            'images',
            'variants',
            'variants_payload',
            'created_at',
            'updated_at',
        ]

    def get_main_image_url(self, obj):
        if not obj.main_image:
            return None
        return obj.main_image.url

    def get_is_sold_out_today(self, obj):
        return bool(obj.is_sold_out_today)

    def _sync_variants(self, product, variants_payload_str):
        if variants_payload_str is None:
            return
        try:
            variants_data = json.loads(variants_payload_str) if isinstance(variants_payload_str, str) else variants_payload_str
        except Exception:
            return
        if not isinstance(variants_data, list):
            return
        product.variants.all().delete()
        for idx, item in enumerate(variants_data):
            variant_name = (item.get('variant_name') or '').strip()
            if not variant_name:
                continue
            raw_price = item.get('price')
            price_val = None
            if raw_price not in (None, '', 'null'):
                try:
                    price_val = float(raw_price)
                except (ValueError, TypeError):
                    price_val = None
            ProductVariant.objects.create(
                product=product,
                variant_group=item.get('variant_group') or 'Option',
                variant_name=variant_name,
                price=price_val,
                is_available=bool(item.get('is_available', True)),
                display_order=item.get('display_order', idx),
            )

    def create(self, validated_data):
        variants_payload = validated_data.pop('variants_payload', None)
        validated_data.pop('remove_main_image', False)
        mark_sold_out_today = validated_data.pop('mark_sold_out_today', None)
        if mark_sold_out_today is True:
            validated_data['sold_out_date'] = timezone.localdate()
        elif mark_sold_out_today is False:
            validated_data['sold_out_date'] = None
        product = super().create(validated_data)
        if variants_payload is not None:
            self._sync_variants(product, variants_payload)
        return product

    def update(self, instance, validated_data):
        variants_payload = validated_data.pop('variants_payload', None)
        remove_main_image = validated_data.pop('remove_main_image', False)
        mark_sold_out_today = validated_data.pop('mark_sold_out_today', None)
        if mark_sold_out_today is True:
            validated_data['sold_out_date'] = timezone.localdate()
        elif mark_sold_out_today is False:
            validated_data['sold_out_date'] = None
        if remove_main_image and instance.main_image:
            instance.main_image.delete(save=False)
            instance.main_image = None
        product = super().update(instance, validated_data)
        if variants_payload is not None:
            self._sync_variants(product, variants_payload)
        return product

