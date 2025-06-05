from django.db import models
from django.utils import timezone

import random
import string


class Category(models.Model):
    category_id = models.BigIntegerField(unique=True)  # 10-digit
    title = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.category_id} - {self.title}"


class SubCategory(models.Model):
    category_id = models.BigIntegerField()
    sub_category_id = models.BigIntegerField(unique=True)  # 10-digit
    title = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.sub_category_id} - {self.title}"


def generate_listing_id():
    from .models import SellerListing
    while True:
        listing_id = ''.join(random.choices(string.digits, k=10))
        if not SellerListing.objects.filter(listing_id=listing_id).exists():
            return listing_id

class SellerListing(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('auto_approved', 'Auto Approved'),
        ('approved', 'Approved'),
        ('inactive', 'Inactive'),
        ('sold', 'Sold'),
        ('deleted', 'Deleted'),
    ]

    listing_id = models.CharField(max_length=15)
    category = models.CharField(max_length=15)
    subcategory = models.CharField(max_length=15)
    
    seller_user_id = models.CharField(max_length=15)
    
    quantity = models.FloatField()
    unit = models.CharField(max_length=20)  # e.g. kg, tons
    description = models.TextField(blank=True)
    
    city_location = models.CharField(max_length=100)
    state_location = models.CharField(max_length=100)
    pincode_location = models.CharField(max_length=100)
    address = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    auto_approved_at = models.DateTimeField(null=True, blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.listing_id:
            new_listing_id = generate_listing_id()
            self.listing_id = new_listing_id

        super().save(*args, **kwargs)


def generate_requirement_id():
    from .models import BuyerRequirement
    while True:
        requirement_id = ''.join(random.choices(string.digits, k=10))
        if not BuyerRequirement.objects.filter(requirement_id=requirement_id).exists():
            return requirement_id

class BuyerRequirement(models.Model):
    requirement_id = models.CharField(max_length=15)
    category = models.CharField(max_length=15)
    subcategory = models.CharField(max_length=15)
    
    buyer_user_id = models.CharField(max_length=15)

    quantity = models.FloatField()
    unit = models.CharField(max_length=20)
    description = models.TextField(blank=True)

    city_location = models.CharField(max_length=100)
    state_location = models.CharField(max_length=100)
    pincode_location = models.CharField(max_length=100)
    address = models.TextField()

    is_urgent = models.BooleanField(default=False)
    attachment = models.FileField(upload_to="requirement_attachments/", null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.requirement_id:
            new_requirement_id = generate_requirement_id()
            self.requirement_id = new_requirement_id

        super().save(*args, **kwargs)

