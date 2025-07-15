from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SellerListingViewSet, AdminListingViewSet, AdminListingApprovalViewSet, AdminListingrejectionViewSet, AllListingsViewset,BuyerRequirementsViewset,AdminBuyerRequirementsViewSet,AllBuyerRequirementsViewset

router = DefaultRouter()
router.register(r'seller-listings', SellerListingViewSet, basename='seller-listings')
router.register(r'admin-listings', AdminListingViewSet, basename='admin-listings')
router.register(r'admin-listings-approval', AdminListingApprovalViewSet, basename='admin-listings-approval')
router.register(r'admin-listings-rejection', AdminListingrejectionViewSet, basename='admin-listings-rejection')
router.register(r'all-listings', AllListingsViewset, basename='all-listings')
router.register(r'buyer-requirements', BuyerRequirementsViewset, basename='buyer-requirements')
router.register(r'admin-buyer-requirements', AdminBuyerRequirementsViewSet, basename='admin-buyer-requirements')
# router.register(r'public-listings', PublicListingViewSet, basename='public-listings')

urlpatterns = [
    path('', include(router.urls)),
]