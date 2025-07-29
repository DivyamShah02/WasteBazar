from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'', HomeViewSet, basename='home')
router.register(r'listings', ListingsViewSet, basename='listings')
router.register(r'listing_detail', ListingDetailViewSet, basename='listing_detail')
router.register(r'login', LoginViewSet, basename='login')
router.register(r'buyer-profile', BuyerProfileViewSet, basename='buyer_profile')
router.register(r'seller-profile', SellerProfileViewSet, basename='seller_profile')
router.register(r'directlogin', directloginViewSet, basename='directlogin')
router.register(r'listing-form', ListingFormViewSet, basename='listing_form')
router.register(r'requirement-form', RequirementFormViewSet, basename='requirement_form')

urlpatterns = [
    path('', include(router.urls)),
]
