from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import random
import string

# Utility to generate custom user_id
def generate_user_id(role):
    from .models import User  # To avoid circular import inside models.py

    prefix_map = {
        'buyer_individual': 'BI',
        'buyer_corporate': 'BC',
        'seller_individual': 'SI',
        'seller_corporate': 'SC',
        'admin': 'AD',
    }
    prefix = prefix_map.get(role, 'XX')

    while True:
        suffix = ''.join(random.choices(string.digits, k=10))
        user_id = f"{prefix}{suffix}"
        if not User.objects.filter(user_id=user_id).exists():
            return user_id

# Custom User model
class User(AbstractUser):
    USER_ROLES = [
        ('admin', 'Admin'),
        ('buyer_individual', 'Buyer - Individual'),
        ('buyer_corporate', 'Buyer - Corporate'),
        ('seller_individual', 'Seller - Individual'),
        ('seller_corporate', 'Seller - Corporate'),
    ]

    user_id = models.CharField(max_length=20, unique=True, editable=False)
    role = models.CharField(max_length=20, choices=USER_ROLES)
    name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)
    is_approved = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)

    # Override save to assign user_id automatically
    def save(self, *args, **kwargs):
        if not self.user_id:
            new_user_id = generate_user_id(self.role)
            self.user_id = new_user_id
            self.username = new_user_id

        # if self.role in ['buyer_corporate', 'seller_corporate']:
        if self.role == 'buyer_corporate':
            self.is_approved = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.user_id})"


# Corporate Buyer Additional Details
class CorporateUserDetail(models.Model):
    user_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)
    company_name = models.CharField(max_length=255)
    pan_number = models.CharField(max_length=20)
    gst_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField()
    certificate_url = models.URLField(blank=True, null=True)  # S3 link or similar
    is_approved = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"Corporate Info for {self.user_id}"


# OTP Verification Model
class OTPVerification(models.Model):    
    mobile = models.CharField(max_length=15)
    otp = models.CharField(max_length=6)    
    
    is_verified = models.BooleanField(default=False)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.mobile} - {self.otp}"
