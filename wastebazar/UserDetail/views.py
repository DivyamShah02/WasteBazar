from rest_framework import viewsets, status
from rest_framework.response import Response

from django.utils import timezone

from .models import *
from .serializers import *

from utils.decorators import handle_exceptions, check_authentication

import random
from datetime import timedelta


def generate_send_otp():
    return ''.join(random.choices('0123456789', k=6))


class OtpAuthViewSet(viewsets.ViewSet):

    @handle_exceptions
    def create(self, request):
        """
        API 1: Generate OTP
        """
        mobile = request.data.get("mobile")
        if not mobile:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Mobile number is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        otp = generate_send_otp()
        otp_obj = OTPVerification.objects.create(
            mobile=mobile,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=5),
            is_verified=False,
            attempt_count=0
        )

        # Optional: send SMS here

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"otp_id": otp_obj.id, "otp": otp},  # remove otp in production
            "error": None
        }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    def update(self, request, pk):
        """
        API 2: Verify OTP & Login/Register
        """

        otp_id = pk
        otp = request.data.get("otp")
        user_type = request.data.get("user_type")  # buyer_individual or buyer_corporate

        if not otp_id or not otp or not user_type:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "otp_id, otp, and user_type are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_obj = OTPVerification.objects.get(id=otp_id)
        except OTPVerification.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Invalid OTP ID."
            }, status=status.HTTP_404_NOT_FOUND)

        if otp_obj.is_verified:
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"otp_verified": False, "message": "OTP already used."},
                "error": None
            }, status=status.HTTP_200_OK)

        if otp_obj.expires_at < timezone.now():
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"otp_verified": False, "message": "OTP expired."},
                "error": None
            }, status=status.HTTP_200_OK)

        if otp_obj.attempt_count >= 3:
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"otp_verified": False, "message": "Maximum attempts reached."},
                "error": None
            }, status=status.HTTP_200_OK)

        if otp_obj.otp != otp:
            otp_obj.attempt_count += 1
            otp_obj.save()
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"otp_verified": False, "message": "Incorrect OTP."},
                "error": None
            }, status=status.HTTP_200_OK)

        # OTP is correct
        otp_obj.is_verified = True
        otp_obj.save()

        user = User.objects.filter(contact_number=otp_obj.mobile, is_deleted=False).first()

        if user:
            user_details_filled = bool(user.name)
        else:
            user = User.objects.create(
                contact_number=otp_obj.mobile,
                role=user_type
            )
            user_details_filled = False

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "otp_verified": True,
                "user_id": user.user_id,
                "user_details": user_details_filled
            },
            "error": None
        }, status=status.HTTP_200_OK)


class UserDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    # @check_authentication
    def update(self, request, pk):
        """
        API 3: Fill User Details after OTP verification
        """
        # user = request.user
        user_id = pk
        user = User.objects.get(user_id=user_id)
        role = user.role

        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Handle corporate user detail creation
            if role in ['buyer_corporate', 'seller_corporate']:
                company_name = request.data.get("company_name")
                pan_number = request.data.get("pan_number")
                gst_number = request.data.get("gst_number")
                address = request.data.get("address")
                certificate_url = request.data.get("certificate_url")
                name = request.data.get('name')
                contact_number = user.contact_number
                email = request.data.get('email')

                is_approved = False
                if role == "seller_corporate":
                    is_approved = True 

                if not company_name or not pan_number or not address:
                    return Response({
                        "success": False,
                        "user_not_logged_in": False,
                        "user_unauthorized": False,
                        "data": None,
                        "error": "Corporate fields missing: company_name, pan_number, address are required."
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Save corporate details
                CorporateUserDetail.objects.update_or_create(
                    user_id=user.user_id,
                    defaults={
                        "name": name,
                        "contact_number": contact_number,
                        "email": email,
                        "company_name": company_name,
                        "pan_number": pan_number,
                        "gst_number": gst_number,
                        "address": address,
                        "certificate_url": certificate_url,
                        "requested_at": timezone.now(),
                        "is_approved": is_approved,
                        "approved_at": timezone.now(),
                        "is_deleted": False,
                        "rejection_reason": None,
                    }
                )

                # Corporate users are inactive until approved
                user.is_active = False
                user.save()

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": serializer.data,
                "error": None
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": None,
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

