from rest_framework import serializers
from apps.business_information.models import BusinessInformation


class BusinessInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessInformation
        fields = [
            'id',
            'business_name',
            'address',
            'phone',
            'email',
            'facebook_url',
            'facebook_page_name',
            'messenger_url',
            'other_social_links',
            'operating_hours',
            'contact_instructions',
            'show_phone',
            'show_email',
            'show_facebook',
            'show_messenger',
            'show_address',
            'show_operating_hours',
            'draft_data',
            'has_unpublished_changes',
            'last_published_at',
            'updated_at',
        ]

