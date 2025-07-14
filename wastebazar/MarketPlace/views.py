from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from django.utils import timezone
from django.db.models import Q

from .models import SellerListing
from .serializers import SellerListingSerializer

from utils.decorators import handle_exceptions, check_authentication

import uuid


class SellerListingViewSet(viewsets.ViewSet):
    @handle_exceptions
    # @check_authentication(required_role='seller_corporate') 
    def list(self, request):
        """Get all listings for the authenticated seller"""
        listings = SellerListing.objects.filter(
            # seller_user_id=request.user.user_id
            seller_user_id="SC5294468983"
        ).order_by('-created_at')
        
        serializer = SellerListingSerializer(listings, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    # @check_authentication(required_role='seller_corporate')  # adjust if needed
    def create(self, request):
        """Create a new seller listing"""
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
            # seller_user_id=request.user.user_id,
            seller_user_id="SC5294468983",
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
    
# ///sldfsfds;fdsf
    @handle_exceptions
    # @check_authentication(required_role='seller_corporate')
    def update(self, request, pk=None):
        """Update an existing seller listing - Enhanced author validation"""
        
        # Step 1: Check if listing exists at all
        try:
            listing_exists = SellerListing.objects.get(listing_id=pk)
        except SellerListing.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Listing not found."
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Step 2: Check if current user owns this listing
        # if listing_exists.seller_user_id != request.user.user_id:
        if listing_exists.seller_user_id != "SC5294468983":
            
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": True,  # More specific error flag
                "data": None,
                "error": "You don't have permission to edit this listing. Only the original author can modify their listings."
            }, status=status.HTTP_403_FORBIDDEN)  # 403 is more appropriate than 404
        
        listing = listing_exists  # Use the found listing
        
        # Step 3: Check if listing can be updated (status validation)
        if listing.status not in ['pending', 'rejected']:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Cannot update {listing.status} listings. Only pending or rejected listings can be updated."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Step 4: Validate and update fields
        data = request.data
        if not data:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "No data provided for update."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        updatable_fields = ['category', 'subcategory', 'quantity', 'unit', 'description', 
                        'city_location', 'state_location', 'pincode_location', 'address']
        
        updated_fields = []
        for field in updatable_fields:
            if field in data:
                setattr(listing, field, data[field])
                updated_fields.append(field)
        
        if not updated_fields:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "No valid fields provided for update."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Step 5: Reset status to pending if it was rejected
        if listing.status != 'pending':
            listing.status = 'pending'
            updated_fields.append('status')
        
        listing.updated_at = timezone.now()
        listing.save()

        serializer = SellerListingSerializer(listing)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "listing": serializer.data,
                "updated_fields": updated_fields,
                "message": "Listing updated successfully by author."
            },
            "error": None
        })


    


    @handle_exceptions
    # @check_authentication(required_role='seller_corporate')
    def partial_update(self, request, pk=None):
        """Mark a listing as sold"""
        try:
            listing = SellerListing.objects.get(
                listing_id=pk, 
                # seller_user_id=request.user.user_id,
                seller_user_id="SC5294468983",
                status='approved'
            )
        except SellerListing.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Listing not found or cannot be marked as sold."
            }, status=status.HTTP_404_NOT_FOUND)

        listing.status = 'sold'
        listing.updated_at = timezone.now()
        listing.save()

        serializer = SellerListingSerializer(listing)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })

    # @handle_exceptions
    # # @check_authentication(required_role='seller_corporate')
    # @action(detail=True, methods=['delete'])
    # def delete_listing(self, request, pk=None):
    #     """Delete a listing (only if pending or rejected)"""
    #     try:
    #         listing = SellerListing.objects.get(
    #             listing_id=pk, 
    #             seller_user_id="SC5294468983"  # request.user.user_id
    #         )
    #     except SellerListing.DoesNotExist:
    #         return Response({
    #             "success": False,
    #             "user_not_logged_in": False,
    #             "user_unauthorized": False,
    #             "data": None,
    #             "error": "Listing not found."
    #         }, status=status.HTTP_404_NOT_FOUND)

    #     if listing.status not in ['pending', 'rejected']:
    #         return Response({
    #             "success": False,
    #             "user_not_logged_in": False,
    #             "user_unauthorized": False,
    #             "data": None,
    #             "error": "Cannot delete approved or sold listings."
    #         }, status=status.HTTP_400_BAD_REQUEST)

    #     listing.delete()
    #     return Response({
    #         "success": True,
    #         "user_not_logged_in": False,
    #         "user_unauthorized": False,
    #         "data": None,
    #         "error": None
    #     }, status=status.HTTP_204_NO_CONTENT)


class AdminListingViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    # @check_authentication(required_role='admin')
    def list(self, request):
        """Get all listings with optional status filter - supports multiple statuses"""
        status_filter = request.query_params.get('status')
        if status_filter == 'approved':
            listings = SellerListing.objects.filter(status='approved').order_by('-created_at')
        elif status_filter == 'pending':
            listings = SellerListing.objects.filter(status='pending').order_by('-created_at')
        elif status_filter == 'rejected':
            listings = SellerListing.objects.filter(status='rejected').order_by('-created_at')  
        else:
            listings = SellerListing.objects.all().order_by('-created_at')

        # if status_filter:
        #     # Split comma-separated statuses and filter
        #     status_list = [status.strip() for status in status_filter.split(',')]
        #     listings = listings.filter(status__in=status_list)
        
        serializer = SellerListingSerializer(listings, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })



class AdminListingApprovalViewSet(viewsets.ViewSet):
    @handle_exceptions
    # @check_authentication(required_role='admin')
    def partial_update(self, request, pk=None):
        """Approve a pending listing"""
        try:
            listing = SellerListing.objects.get(listing_id=pk, status='pending')
        except SellerListing.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Pending listing not found."
            }, status=status.HTTP_404_NOT_FOUND)

        listing.status = 'approved'
        listing.approved_at = timezone.now()
        listing.revival_time = timezone.now()  # Set revival time to current time
        # listing.approved_by = request.user.user_id
        listing.save()

        serializer = SellerListingSerializer(listing)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })


class AdminListingrejectionViewSet(viewsets.ViewSet):
    @handle_exceptions
    # @check_authentication(required_role='admin')
    # @action(detail=True, methods=['patch'])
    def partial_update(self, request, pk=None):
        """Reject a pending listing"""
        try:
            listing = SellerListing.objects.get(listing_id=pk, status='pending')
        except SellerListing.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Pending listing not found."
            }, status=status.HTTP_404_NOT_FOUND)

        rejection_reason = request.data.get('rejection_reason', '')
        
        listing.status = 'rejected'
        listing.rejection_reason = rejection_reason
        listing.rejected_at = timezone.now()
        # listing.rejected_by = request.user.user_id
        listing.save()

        serializer = SellerListingSerializer(listing)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })

    
class AllListingsViewset(viewsets.ViewSet):
    @handle_exceptions
    # @check_authentication(required_role='admin')
    def list(self, request):
        """Get all approved listings only"""
        listings = SellerListing.objects.filter(status='approved').order_by('-created_at')
        
        serializer = SellerListingSerializer(listings, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })