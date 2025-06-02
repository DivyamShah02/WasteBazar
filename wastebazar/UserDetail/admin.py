from django.contrib import admin
from .models import User, CorporateUserDetail, OTPVerification


# Custom admin for User model
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    model = User
    list_display = ('user_id', 'name', 'contact_number', 'email', 'role', 'is_deleted')
    list_filter = ('role', 'is_active', 'is_deleted')
    search_fields = ('user_id', 'name', 'contact_number', 'email', 'username')
    ordering = ('-date_joined',)

    # fieldsets = (
    #     (None, {'fields': ('username', 'password')}),
    #     ("User Info", {'fields': ('user_id', 'role', 'name', 'contact_number', 'email')}),
    #     ("Permissions", {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    #     ("Status", {'fields': ('is_deleted',)}),
    #     ("Dates", {'fields': ('last_login', 'date_joined')}),
    # )
    # readonly_fields = ('user_id', 'date_joined', 'last_login')


# Admin for CorporateUserDetail
@admin.register(CorporateUserDetail)
class CorporateUserDetailAdmin(admin.ModelAdmin):
    list_display = (
        'user_id', 'company_name', 'pan_number', 'gst_number',
        'is_approved', 'requested_at', 'approved_at', 'is_deleted'
    )
    list_filter = ('is_approved', 'is_deleted')
    search_fields = ('user_id', 'company_name', 'pan_number', 'gst_number')


# Admin for OTPVerification
@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = (
        'mobile', 'otp', 'is_verified', 'attempt_count', 'created_at', 'expires_at'
    )
    list_filter = ('is_verified', )
    search_fields = ('mobile', 'otp')

