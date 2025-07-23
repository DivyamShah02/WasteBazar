from rest_framework import viewsets, status
from rest_framework.response import Response

from django.utils import timezone

from .models import *
from .serializers import *
from .utils import generate_send_otp


from utils.decorators import handle_exceptions, check_authentication

from datetime import timedelta


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

        otp = generate_send_otp(contact_number=mobile)
        otp_obj = OTPVerification.objects.create(
            mobile=mobile,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=5),
            is_verified=False,
            attempt_count=0
        )

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

        if otp_obj.attempt_count >= 2:
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
            # Create wallet for buyer users
            if user_type in ['buyer_individual', 'buyer_corporate']:
                initial_credits = 5 if user_type == 'buyer_individual' else 3
                Wallet.objects.create(
                    user_id=user.user_id,
                    role=user_type,
                    free_credits=initial_credits,
                    paid_credits=0,
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
    @check_authentication()
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


class CorporateBuyerViewSet(viewsets.ViewSet):
    """Approve / Reject corporate buyer API"""
    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        unapproved_corporate_profiles_obj = CorporateUserDetail.objects.filter(is_approved=False, is_deleted=False, is_rejected=False)
        unapproved_corporate_profiles = CorporateUserDetailSerializer(unapproved_corporate_profiles_obj, many=True).data

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": unapproved_corporate_profiles,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk):
        user_id = pk

        corporate_buyer_obj = CorporateUserDetail.objects.get(user_id=user_id, is_deleted=False)
        if not corporate_buyer_obj:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Corporate Buyer with this id doesnot exists."
            }, status=status.HTTP_200_OK)
        
        is_approved = request.data.get('is_approved')
        reason = request.data.get('reason')

        if is_approved is True:
            corporate_buyer_obj.is_rejected = False
            corporate_buyer_obj.is_approved = True
            corporate_buyer_obj.approved_at = timezone.now()
            corporate_buyer_obj.save()

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": "Approved.",
                "error": None
            }, status=status.HTTP_200_OK)
        
        else:
            corporate_buyer_obj.is_approved = False
            corporate_buyer_obj.is_rejected = True
            corporate_buyer_obj.rejected_at = timezone.now()
            corporate_buyer_obj.rejection_reason = reason
            corporate_buyer_obj.save()

            return Response({
                    "success": True,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": "UnApproved due to mentioned reason.",
                    "error": None
                }, status=status.HTTP_200_OK)


class AccountCreationViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    # @check_authentication(required_role='admin')
    def create(self, request):
            name = request.data.get('name')
            password = request.data.get('password')
            contact_number = request.data.get('contact_number')
            email = request.data.get('email')
            role = request.data.get('role')            

            USER_ROLES = [
                'admin',
                'buyer_individual',
                'buyer_corporate',
                'seller_individual',
                'seller_corporate',
            ]


            email_already_user = User.objects.filter(is_active=True, email=email).exists()
            contact_number_already_user = User.objects.filter(is_active=True, contact_number=contact_number).exists()

            if email_already_user or contact_number_already_user:
                return Response(
                        {
                            "success": False,                            
                            "user_not_logged_in": False,
                            "user_unauthorized": False,
                            "data":None,
                            "error": "User already registered."
                        }, status=status.HTTP_400_BAD_REQUEST)

            if not name or not contact_number or not email or role not in USER_ROLES:
                return Response(
                        {
                            "success": False,                            
                            "user_not_logged_in": False,
                            "user_unauthorized": False,
                            "data":None,
                            "error": "Missing required fields."
                        }, status=status.HTTP_400_BAD_REQUEST)


            if str(role) == 'admin':
                user = User.objects.create_superuser(
                    username=email,
                    password = password,
                    email=email,
                    name=name,
                    contact_number=contact_number,
                    role=role,
                )
            
            else:
                user = User.objects.create_user(
                    username=email,
                    password = password,
                    email=email,
                    name=name,
                    contact_number=contact_number,
                    role=role,
                    is_approved=True,
                )

            user_detail_serializer = UserSerializer(user)
            user_data = user_detail_serializer.data

            if role in ['buyer_corporate', 'seller_corporate']:
                company_name = request.data.get("company_name")
                pan_number = request.data.get("pan_number")
                gst_number = request.data.get("gst_number")
                address = request.data.get("address")
                certificate_url = request.data.get("certificate_url")
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

            return Response(
                        {
                            "success": True,  
                            "user_not_logged_in": False,
                            "user_unauthorized": False,                       
                            "data": user_data,
                            "error": None
                        }, status=status.HTTP_201_CREATED)


class BuyerCreditUpdateViewSet(viewsets.ViewSet):
    """API to update buyer credits if reset date has passed"""
    
    @handle_exceptions
    # @check_authentication()
    def list(self, request, pk=None):
        """
        API: List all buyers and reset credits only if current date >= free_credit_reset_date
        """
        current_time = timezone.now()
        current_date = current_time.date()
        
        # Get all buyer users (individual and corporate)
        buyer_users = User.objects.filter(
            role__in=['buyer_individual', 'buyer_corporate'],
            is_deleted=False,
            is_active=True
        )
        
        credits_reset_users = []
        no_wallet_users = []
        
        
        for user in buyer_users:
            # Try to get existing wallet
            try:
                wallet = Wallet.objects.get(user_id=user.user_id)
            except Wallet.DoesNotExist:
                no_wallet_users.append({
                    'user_id': user.user_id,
                    'name': user.name,
                    'role': user.role,
                    'message': 'No wallet found for this user'
                })
                continue
            
            # Check if reset is due (current date >= free_credit_reset_date)
            if current_date >= wallet.free_credit_reset_date.date():
                # Store previous values before reset
                previous_credits = wallet.free_credits
                previous_reset_date = wallet.free_credit_reset_date
                
                # Call the reset method
                reset_success = wallet.reset_free_credits_if_due()
                
                if reset_success:
                    user_data = {
                        'user_id': user.user_id,
                        'name': user.name,
                        'role': user.role,
                        'credits_reset': True,
                        'previous_free_credits': previous_credits,
                        'new_free_credits': wallet.free_credits,
                        'previous_reset_date': previous_reset_date,
                        'new_reset_date': wallet.free_credit_reset_date,
                        'reset_timestamp': wallet.last_free_credit_reset,
                        'paid_credits': wallet.paid_credits,
                        
                    }
                    credits_reset_users.append(user_data)

        response_data = {
            'current_date': current_date,
            'total_buyers_found': len(buyer_users),
            'credits_reset_count': len(credits_reset_users),
            'no_wallet_count': len(no_wallet_users),
            'credits_reset_users': credits_reset_users,
            'no_wallet_users': no_wallet_users,
            'summary': {
                'message': f"Processed {len(buyer_users)} buyer users. Reset credits for {len(credits_reset_users)} users whose reset date was due.",
                'update_timestamp': current_time
            }
        }
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": response_data,
            "error": None
        }, status=status.HTTP_200_OK)


class BuyerDetailViewSet(viewsets.ViewSet):
    """API to get particular buyer details including corporate details if applicable"""
    
    @handle_exceptions
    # @check_authentication()
    def retrieve(self, request, pk=None):
        """
        API: Get buyer details by user_id
        If buyer is corporate, also include corporate details
        """
        user_id = pk
        
        try:
            # Get the buyer user
            buyer = User.objects.get(
                user_id=user_id,
                role__in=['buyer_individual', 'buyer_corporate'],
                is_deleted=False
            )
        except User.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Buyer not found with this ID."
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Serialize basic user data
        user_serializer = UserSerializer(buyer)
        response_data = {
            'user_details': user_serializer.data,
            'corporate_details': None,
            'wallet_details': None
        }
        
        # If buyer is corporate, get corporate details
        if buyer.role == 'buyer_corporate':
            try:
                corporate_details = CorporateUserDetail.objects.get(
                    user_id=user_id,
                    is_deleted=False
                )
                corporate_serializer = CorporateUserDetailSerializer(corporate_details)
                response_data['corporate_details'] = corporate_serializer.data
            except CorporateUserDetail.DoesNotExist:
                response_data['corporate_details'] = {
                    'message': 'Corporate details not found for this buyer'
                }
        
        # Get wallet details if exists
        try:
            wallet = Wallet.objects.get(user_id=user_id)
            wallet_serializer = WalletSerializer(wallet)
            response_data['wallet_details'] = wallet_serializer.data
        except Wallet.DoesNotExist:
            response_data['wallet_details'] = {
                'message': 'Wallet not found for this buyer'
            }
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": response_data,
            "error": None
        }, status=status.HTTP_200_OK)
    
