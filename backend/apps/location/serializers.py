from rest_framework import serializers
from apps.location.models import BusinessLocation


class BusinessLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessLocation
        fields = [
            'id',
            'business_name',
            'address',
            'latitude',
            'longitude',
            'map_zoom',
            'nearby_landmarks',
            'directions_information',
            'business_hours',
            'google_maps_url',
            'draft_data',
            'has_unpublished_changes',
            'last_published_at',
            'updated_at',
        ]

