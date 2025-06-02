from rest_framework import serializers
from .models import User, CorporateUserDetail, OTPVerification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'user_id',
            'role',
            'name',
            'contact_number',
            'email',
            'username',
            'is_deleted',
        ]
        read_only_fields = ['user_id']


class CorporateUserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CorporateUserDetail
        fields = [
            'user_id',
            'name',
            'contact_number',
            'email',
            'company_name',
            'pan_number',
            'gst_number',
            'address',
            'certificate_url',
            'is_approved',
            'rejection_reason',
            'requested_at',
            'approved_at',
            'is_deleted',
        ]
        read_only_fields = ['requested_at', 'approved_at']


class OTPVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPVerification
        fields = [
            'mobile',
            'otp',
            'is_verified',
            'attempt_count',
            'created_at',
            'expires_at',
        ]
        read_only_fields = ['created_at', 'expires_at', 'attempt_count', 'is_verified']
