import requests
import pdb

BASE_URL = "http://localhost:8000/user-api"  # Change this to your server domain


def generate_otp(mobile):
    url = f"{BASE_URL}/otp-api/"
    payload = {
        "mobile": mobile
    }

    response = requests.post(url, json=payload)
    return response.json()


def verify_otp(otp_id, otp, user_type):
    url = f"{BASE_URL}/otp-api/{otp_id}/"
    payload = {
        "otp": otp,
        "user_type": user_type  # buyer_individual / seller_individual etc.
    }

    response = requests.put(url, json=payload)
    return response.json()


def fill_user_details(user_id, role):
    url = f"{BASE_URL}/user-details-api/{user_id}/"

    if role in ['buyer_corporate', 'seller_corporate']:
        payload = {
            "name": "bntusprt fdestrhjni",        
            "email": "fesrnhjip@crrh.com",
            
            "company_name": "sfeargstjniph Pvt. Ltd.",
            "pan_number": "JJCGE1484F",
            "gst_number": "19AKFDC3864F7H5",
            "address": "501, Corporate Park, Mumbai",
            "certificate_url": "https://example.com/certificate.pdf"
        }
    
    else:
        payload = {
            "name": "sersgt Patel",
            "email": "etshr@rple.com"
        }


    response = requests.put(url, json=payload)
    return response.json()


if __name__ == '__main__':

    role = "seller_individual"

    res = generate_otp("4875635212")
    print("Generated OTP:", res)
    otp_id = res['data']['otp_id']
    otp = res['data']['otp']  # For testing

    # Step 2: Verify OTP
    res = verify_otp(otp_id=otp_id, otp=otp, user_type=role)
    print("Verify OTP Response:", res)
    user_id = res['data']['user_id']
    user_details_added = res['data']['user_details']

    # user_id = "BI6880961986"
    # user_details_added = True

    pdb.set_trace()
    if not user_details_added:
        # Step 3: Fill Details
        res = fill_user_details(user_id, role=role)
        print("Fill Details Response:", res)
    else:
        print("User already has full details.")
