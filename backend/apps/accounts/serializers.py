from rest_framework import serializers
from django.contrib.auth.models import User
from apps.accounts.models import Account, AuditLog


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active',
            'is_superuser',
            'role',
            'permissions',
            'date_joined',
            'last_login',
        ]
        read_only_fields = ['id', 'is_superuser', 'date_joined', 'last_login']

    def get_role(self, obj):
        profile = getattr(obj, 'account_profile', None)
        if profile:
            return profile.role
        return 'OWNER' if obj.is_superuser else 'ADMIN'

    def get_permissions(self, obj):
        profile = getattr(obj, 'account_profile', None)
        return profile.permissions if profile else {'all': True}


class AdminUserCrudSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=[('OWNER', 'Owner (Full Access)'), ('ADMIN', 'Authorized Administrator')],
        default='ADMIN',
        required=False,
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active',
            'role',
            'password',
            'date_joined',
            'last_login',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def to_representation(self, instance):
        # Ensure role attribute exists on User instance before ModelSerializer.to_representation
        profile = getattr(instance, 'account_profile', None)
        resolved_role = profile.role if profile else ('OWNER' if instance.is_superuser else 'ADMIN')
        instance.role = resolved_role
        data = super().to_representation(instance)
        data['role'] = resolved_role
        return data

    def create(self, validated_data):
        role = validated_data.pop('role', 'ADMIN')
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Password is required when creating an account.'})

        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=validated_data.get('is_active', True),
            is_staff=True,
            is_superuser=(role == 'OWNER'),
        )
        user.set_password(password)
        user.save()

        profile, _ = Account.objects.update_or_create(
            user=user,
            defaults={
                'role': role,
                'permissions': {'all': True} if role == 'OWNER' else {'cms': True},
            },
        )
        user.account_profile = profile
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        if role:
            instance.is_superuser = (role == 'OWNER')
            instance.is_staff = True
            profile, _ = Account.objects.update_or_create(
                user=instance,
                defaults={
                    'role': role,
                    'permissions': {'all': True} if role == 'OWNER' else {'cms': True},
                },
            )
            instance.account_profile = profile

        if password and password.strip():
            instance.set_password(password.strip())

        instance.save()
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'username', 'action', 'section', 'summary', 'created_at']
