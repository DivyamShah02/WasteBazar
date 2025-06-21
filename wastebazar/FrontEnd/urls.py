from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'home', HomeViewSet, basename='home')
router.register(r'listings', ListingsViewSet, basename='listings')
router.register(r'listing_detail', ListingDetailViewSet, basename='listing_detail')

urlpatterns = [
    path('', include(router.urls)),
]
