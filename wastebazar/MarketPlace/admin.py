from django.contrib import admin
from .models import Category, SubCategory, SellerListing, BuyerRequirement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['category_id', 'title', 'is_active', 'created_at']
    search_fields = ['category_id', 'title']
    list_filter = ['is_active']


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ['sub_category_id', 'title', 'category_id', 'is_active', 'created_at']
    search_fields = ['sub_category_id', 'title']
    list_filter = ['is_active', 'category_id']


@admin.register(SellerListing)
class SellerListingAdmin(admin.ModelAdmin):
    list_display = ['listing_id', 'seller_user_id', 'subcategory', 'quantity', 'unit', 'status', 'created_at']
    search_fields = ['listing_id', 'seller_user_id', 'subcategory']
    list_filter = ['status', 'is_deleted', 'created_at']


@admin.register(BuyerRequirement)
class BuyerRequirementAdmin(admin.ModelAdmin):
    list_display = ['requirement_id', 'buyer_user_id', 'subcategory', 'quantity', 'unit', 'is_active', 'created_at']
    search_fields = ['requirement_id', 'buyer_user_id', 'subcategory']
    list_filter = ['is_active', 'is_deleted', 'created_at']
