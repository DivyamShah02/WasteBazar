from rest_framework import viewsets, status
from rest_framework.response import Response

from django.utils import timezone
from django.shortcuts import render

from utils.decorators import handle_exceptions, check_authentication

from datetime import timedelta


class HomeViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "index.html")
    

class ListingsViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "listings.html")


class RequirementsViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "requirements.html")


class ListingDetailViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "listing-detail.html")
    
    def retrieve(self, request, pk=None):
        """Render listing detail page for a specific listing ID"""
        context = {
            'listing_id': pk
        }
        return render(request, "listing-detail.html", context)


class LoginViewSet(viewsets.ViewSet):
    
    def list(self, request):
        return render(request, "login.html")


class directloginViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "direct_login.html")


class BuyerProfileViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "buyer_profile.html")
    

class SellerProfileViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "seller_profile.html")

class ListingFormViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "listing_form.html")
    
    def retrieve(self, request, pk=None):
        """Render listing form page for a specific listing ID"""
        context = {
            'listing_id': pk
        }
        return render(request, "listing_form.html", context)

class ListingEditViewSet(viewsets.ViewSet):

    def list(self, request):
        """Redirect to specific listing edit (listing_id required)"""
        return render(request, "listing_edit.html", {
            'error': 'Listing ID is required for editing'
        })
    
    def retrieve(self, request, pk=None):
        """Render listing edit page for a specific listing ID"""
        if not pk:
            return render(request, "listing_edit.html", {
                'error': 'Listing ID is required for editing'
            })
        
        context = {
            'listing_id': pk
        }
        return render(request, "listing_edit.html", context)
    
class RequirementFormViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "requirement_form.html")
    
    def retrieve(self, request, pk=None):
        """Render requirement form page for a specific requirement ID"""
        context = {
            'requirement_id': pk
        }
        return render(request, "requirement_form.html", context)

class DashboardViewSet(viewsets.ViewSet):

    def list(self, request):
        """Render the admin dashboard"""
        return render(request, "dashboard.html")
    
