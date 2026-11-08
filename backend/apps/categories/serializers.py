from rest_framework import serializers
from apps.categories.models import Category


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    published_product_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    remove_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'image',
            'image_url',
            'remove_image',
            'display_order',
            'is_published',
            'product_count',
            'published_product_count',
            'created_at',
            'updated_at',
        ]

    def get_product_count(self, obj):
        return obj.products.filter(is_archived=False).count()

    def get_published_product_count(self, obj):
        return obj.products.filter(is_published=True, is_archived=False).count()

    def get_image_url(self, obj):
        if not obj.image:
            return None
        return obj.image.url

    def update(self, instance, validated_data):
        if validated_data.pop('remove_image', False) and instance.image:
            instance.image.delete(save=False)
            instance.image = None
        return super().update(instance, validated_data)
