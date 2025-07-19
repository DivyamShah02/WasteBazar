from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from django.utils import timezone
from django.db.models import Q

from .models import SellerListing,BuyerRequirement
from .serializers import SellerListingSerializer, BuyerRequirementSerializer

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
    # @check_authentication(required_role='buyer_corporate')  # Adjust if needed
    def list(self, request):
        """Get approved listings with optional filtering and sorting"""
        # Start with approved listings only
        listings = SellerListing.objects.filter(status='approved')
        
        # Get filter parameters from request body or query params
        filters = request.data if request.data else request.query_params
        
        # Apply filters if provided
        if filters.get('category'):
            listings = listings.filter(category__icontains=filters['category'])
            
        if filters.get('subcategory'):
            listings = listings.filter(subcategory__icontains=filters['subcategory'])
            
        if filters.get('city_location'):
            listings = listings.filter(city_location__icontains=filters['city_location'])
            
        if filters.get('state_location'):
            listings = listings.filter(state_location__icontains=filters['state_location'])
            
       
        # Quantity range filtering
        if filters.get('min_quantity'):
            listings = listings.filter(quantity__gte=filters['min_quantity'])
            
        if filters.get('max_quantity'):
            listings = listings.filter(quantity__lte=filters['max_quantity'])
            
        if filters.get('unit'):
            listings = listings.filter(unit__icontains=filters['unit'])
        
        # Sorting options
        sort_by = filters.get('sort_by', 'approved_at')  # Default sort by approved_at
        sort_order = filters.get('sort_order', 'desc')  # Default descending order
        
        # Available sorting fields
        valid_sort_fields = {
            'approved_at': 'auto_approved_at',  # Using auto_approved_at as proxy for approved_at
            'quantity': 'quantity',
            'unit': 'unit',
            'city_location': 'city_location',
            'state_location': 'state_location',
            'revived_at': 'revived_at',
        }
        
        # Apply sorting
        if sort_by in valid_sort_fields:
            sort_field = valid_sort_fields[sort_by]
            if sort_order.lower() == 'asc':
                listings = listings.order_by(sort_field)
            else:  # Default to desc
                listings = listings.order_by(f'-{sort_field}')
        else:
            # Default sorting by auto_approved_at (newest first)
            listings = listings.order_by('-auto_approved_at')
        
        serializer = SellerListingSerializer(listings, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    def retrieve(self, request, pk=None):
        """Get detailed information for a specific listing"""
        try:
            listing = SellerListing.objects.get(
                listing_id=pk,
                status='approved'  # Only allow viewing approved listings
            )
        except SellerListing.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Listing not found or not available."
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = SellerListingSerializer(listing)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })
    

class BuyerRequirementsViewset(viewsets.ViewSet):

    @handle_exceptions
    # @check_authentication(required_role='buyer_corporate') 
    def list(self, request):
        """Get all listings for the authenticated buyer"""
        requirements = BuyerRequirement.objects.filter(
            # buyer_user_id=request.user.user_id
            buyer_user_id="BI8952706973"  # Replace with actual buyer ID
        ).exclude(status='deleted').order_by('-created_at')
        
        serializer = BuyerRequirementSerializer(requirements, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })
    
    @handle_exceptions
    # @check_authentication(required_role='buyer_corporate')
    def create(self, request):
        """Create a new buyer requirement listing"""
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

        requirement = BuyerRequirement.objects.create(
            # buyer_user_id=request.user.user_id,
            buyer_user_id="BI8952706973",
            category=data['category'],
            subcategory=data['subcategory'],
            quantity=data['quantity'],
            unit=data['unit'],
            description=data.get('description', ''),
            city_location=data['city_location'],
            state_location=data['state_location'],
            pincode_location=data['pincode_location'],
            address=data['address'],
            status='active'
        )

        # Set revived_at and valid_until similar to SellerListing
        requirement.revived_at = timezone.now()
        requirement.valid_until = requirement.revived_at + timezone.timedelta(days=7)
        requirement.save()

        serializer = BuyerRequirementSerializer(requirement)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    # @check_authentication(required_role='buyer_corporate')
    def update(self, request, pk=None):
        """Update an existing buyer requirement listing"""
        
        # Step 1: Check if requirement exists at all
        try:
            requirement_exists = BuyerRequirement.objects.get(requirement_id=pk)
        except BuyerRequirement.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Requirement not found."
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Step 2: Check if current user owns this requirement
        if requirement_exists.buyer_user_id != "BI8952706973":  # Replace with actual buyer ID
            # if requirement_exists.buyer_user_id != request.user.user_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": True,
                "data": None,
                "error": "You don't have permission to edit this requirement. Only the original author can modify their requirements."
            }, status=status.HTTP_403_FORBIDDEN)
        
        requirement = requirement_exists
        
        # Step 3: Check if requirement can be updated
        if requirement.status in ['requirementfulfilled', 'deleted']:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Cannot update {requirement.status} requirements. Only active or inactive requirements can be updated."
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
                setattr(requirement, field, data[field])
                updated_fields.append(field)
        
        if not updated_fields:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "No valid fields provided for update."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Step 5: Reset status to active if it was inactive and update revival time
        if requirement.status == 'inactive':
            requirement.status = 'active'
            requirement.revived_at = timezone.now()
            requirement.valid_until = requirement.revived_at + timezone.timedelta(days=7)
            updated_fields.append('status')
        
        requirement.save()

        serializer = BuyerRequirementSerializer(requirement)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "requirement": serializer.data,
                # "updated_fields": updated_fields,
                "message": "Requirement updated successfully by author."
            },
            "error": None
        })

    @handle_exceptions
    # @check_authentication(required_role='buyer_corporate')
    def partial_update(self, request, pk=None):
        """Mark a requirement as fulfilled"""
        try:
            requirement = BuyerRequirement.objects.get(
                requirement_id=pk, 
                buyer_user_id="BI8952706973",
                status='active'
            )
        except BuyerRequirement.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Active requirement not found or cannot be marked as fulfilled."
            }, status=status.HTTP_404_NOT_FOUND)

        requirement.status = 'requirementfulfilled'
        requirement.save()

        serializer = BuyerRequirementSerializer(requirement)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "requirement": serializer.data,
                "message": "Requirement marked as fulfilled successfully."
            },
            "error": None
        })
    



    # @handle_exceptions
    # # @check_authentication(required_role='buyer_corporate')
    # @action(detail=True, methods=['patch'])
    # def revive_requirement(self, request, pk=None):
    #     """Revive an inactive requirement"""
    #     try:
    #         requirement = BuyerRequirement.objects.get(
    #             requirement_id=pk, 
    #             buyer_user_id="BC5294468983",
    #             status='inactive'
    #         )
    #     except BuyerRequirement.DoesNotExist:
    #         return Response({
    #             "success": False,
    #             "user_not_logged_in": False,
    #             "user_unauthorized": False,
    #             "data": None,
    #             "error": "Inactive requirement not found or cannot be revived."
    #         }, status=status.HTTP_404_NOT_FOUND)

    #     requirement.status = 'active'
    #     requirement.revived_at = timezone.now()
    #     requirement.valid_until = requirement.revived_at + timezone.timedelta(days=7)
    #     requirement.save()

    #     serializer = BuyerRequirementSerializer(requirement)
    #     return Response({
    #         "success": True,
    #         "user_not_logged_in": False,
    #         "user_unauthorized": False,
    #         "data": {
    #             "requirement": serializer.data,
    #             "message": "Requirement revived successfully."
    #         },
    #         "error": None
    #     })

class AdminBuyerRequirementsViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    # @check_authentication(required_role='admin')
    def list(self, request):
        """Get all buyer requirements with optional status filter"""
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            requirements = BuyerRequirement.objects.filter(status='active').order_by('-created_at')
        elif status_filter == 'inactive':
            requirements = BuyerRequirement.objects.filter(status='inactive').order_by('-created_at')
        elif status_filter == 'requirementfulfilled':
            requirements = BuyerRequirement.objects.filter(status='requirementfulfilled').order_by('-created_at')
        elif status_filter == 'deleted':
            requirements = BuyerRequirement.objects.filter(status='deleted').order_by('-created_at')
        else:
            requirements = BuyerRequirement.objects.all().order_by('-created_at')

        serializer = BuyerRequirementSerializer(requirements, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })


class AllBuyerRequirementsViewset(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get active buyer requirements with optional filtering and sorting"""
        # Start with active requirements only
        requirements = BuyerRequirement.objects.filter(status='active')
        
        # Get filter parameters from request body or query params
        filters = request.query_params
        
        # Apply filters if provided
        if filters.get('category'):
            requirements = requirements.filter(category__icontains=filters['category'])
            
        if filters.get('subcategory'):
            requirements = requirements.filter(subcategory__icontains=filters['subcategory'])
            
        if filters.get('city_location'):
            requirements = requirements.filter(city_location__icontains=filters['city_location'])
            
        if filters.get('state_location'):
            requirements = requirements.filter(state_location__icontains=filters['state_location'])
            
        # Quantity range filtering
        if filters.get('min_quantity'):
            requirements = requirements.filter(quantity__gte=filters['min_quantity'])
            
        if filters.get('max_quantity'):
            requirements = requirements.filter(quantity__lte=filters['max_quantity'])
            
        if filters.get('unit'):
            requirements = requirements.filter(unit__icontains=filters['unit'])
        
        # Sorting options
        sort_by = filters.get('sort_by', 'created_at')  # Default sort by created_at
        sort_order = filters.get('sort_order', 'desc')  # Default descending order
        
        # Available sorting fields
        valid_sort_fields = {
            'created_at': 'created_at',
            'quantity': 'quantity',
            'unit': 'unit',
            'city_location': 'city_location',
            'state_location': 'state_location',
            'revived_at': 'revived_at',
        }
        
        # Apply sorting
        if sort_by in valid_sort_fields:
            sort_field = valid_sort_fields[sort_by]
            if sort_order.lower() == 'asc':
                requirements = requirements.order_by(sort_field)
            else:  # Default to desc
                requirements = requirements.order_by(f'-{sort_field}')
        else:
            # Default sorting by created_at (newest first)
            requirements = requirements.order_by('-created_at')
        
        serializer = BuyerRequirementSerializer(requirements, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        })