from rest_framework import serializers
from .models import Category, SubCategory, SellerListing, BuyerRequirement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = '__all__'


class SellerListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerListing
        fields = '__all__'


class BuyerRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerRequirement
        fields = '__all__'
