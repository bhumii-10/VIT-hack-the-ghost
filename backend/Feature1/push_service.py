import os
import json
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv
from pathlib import Path

# Load env vars
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_MAILTO = os.getenv("VAPID_MAILTO", "mailto:bingostingo1@gmail.com")

print(f"DEBUG: VAPID Status: PUB={bool(VAPID_PUBLIC_KEY)}, PRIV={bool(VAPID_PRIVATE_KEY)}, MAIL={bool(VAPID_MAILTO)}")

def send_web_push(subscription_info, data):
    """
    Sends a web push notification.
    :param subscription_info: Dict containing endpoint, keys (p256dh, auth)
    :param data: Dict containing title, body, icon, etc.
    """
    try:
        response = webpush(
            subscription_info=subscription_info,
            data=json.dumps(data),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_MAILTO}
        )
        print(f"DEBUG: Push sent. Status: {response.status_code}")
        return response.status_code == 201
    except WebPushException as ex:
        print(f"ERROR: Web Push failed: {ex}")
        # If 410 (Gone) or 404, we should ideally remove the subscription from DB
        return False
    except Exception as e:
        print(f"ERROR: Unexpected push error: {e}")
        return False
