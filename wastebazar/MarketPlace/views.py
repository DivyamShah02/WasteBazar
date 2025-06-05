from rest_framework import viewsets, status
from rest_framework.response import Response

from django.utils import timezone

from .models import SellerListing
from .serializers import SellerListingSerializer

from utils.decorators import handle_exceptions, check_authentication

import uuid


class SellerListingViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='seller_corporate')  # adjust if needed
    def create(self, request):
        data = request.data

        required_fields = ['category', 'subcategory', 'quantity', 'unit', 'city_location', 'state_location', 'pincode_location', 'address']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": f"{field} is required."
                }, status=status.HTTP_400_BAD_REQUEST)

        listing = SellerListing.objects.create(
            seller_user_id=request.user.user_id,
            category=data['category'],
            subcategory=data['subcategory'],
            quantity=data['quantity'],
            unit=data['unit'],
            description=data.get('description', ''),
            city_location=data['city_location'],
            state_location=data['state_location'],
            pincode_location=data['pincode_location'],
            address=data['address'],
            status='pending'
        )

        serializer = SellerListingSerializer(listing)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        }, status=status.HTTP_201_CREATED)
