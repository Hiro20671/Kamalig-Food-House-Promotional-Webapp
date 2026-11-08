from rest_framework import serializers
from apps.promotions.models import Promotion


class PromotionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    remove_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Promotion
        fields = [
            'id',
            'title',
            'subtitle',
            'description',
            'badge_text',
            'image',
            'image_url',
            'remove_image',
            'button_label',
            'button_destination',
            'is_published',
            'display_order',
            'created_at',
            'updated_at',
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        return obj.image.url

    def update(self, instance, validated_data):
        remove_image = validated_data.pop('remove_image', False)
        if remove_image and instance.image:
            instance.image.delete(save=False)
            instance.image = None
        return super().update(instance, validated_data)

