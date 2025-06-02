import random

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_to_mobile(contact_number, otp):
    # For now just print to console
    print(f"Sending OTP {otp} to {contact_number}")
    # Later you can integrate with SMS gateway here
    return True
