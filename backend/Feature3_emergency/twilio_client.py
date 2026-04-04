import os
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_twilio_client():
    """
    Initializes and returns the Twilio Client.
    Credentials are read from environment variables.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        # Return none or raise error, depending on preference. 
        # For this demo, we'll log a warning and return None.
        print("⚠️ Twilio Credentials Missing in .env")
        return None

    return Client(account_sid, auth_token)
