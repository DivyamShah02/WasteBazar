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


class ProfileViewSet(viewsets.ViewSet):

    def list(self, request):
        return render(request, "buyer_profile.html")
    
