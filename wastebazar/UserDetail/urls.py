from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'otp-api', OtpAuthViewSet, basename='otp-api')
router.register(r'user-details-api', UserDetailViewSet, basename='user-details-api')

router.register(r'corporate-buyer-api', CorporateBuyerViewSet, basename='corporate-buyer-api')

router.register(r'admin-user-creation-api', AccountCreationViewSet, basename='admin-user-creation-api')


urlpatterns = [
    path('', include(router.urls)),
]
