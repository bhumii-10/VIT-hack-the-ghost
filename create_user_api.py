import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

email = "test@gmail.com"
password = "password123"

print(f"Attempting to sign up user {email}...")

try:
    # 1. Try to Sign Up (This creates the user in auth.users)
    res = supabase.auth.sign_up({
        "email": email, 
        "password": password,
        "options": {
            "data": {
                "full_name": "Test User",
                "phone_number": "1234567890"
            }
        }
    })
    
    if res.user:
        print(f"SUCCESS: User created with ID: {res.user.id}")
        
        # 2. Add to public.profiles if not auto-created
        # Note: If your trigger is active, this part might be redundant or fail
        try:
            profile_data = {
                "id": res.user.id,
                "full_name": "Test User",
                "role": "user",
                "phone_number": "1234567890"
            }
            data = supabase.table("profiles").upsert(profile_data).execute()
            print("SUCCESS: Profile upserted.")
        except Exception as e:
            print(f"WARNING: Could not upsert profile (might already exist): {e}")

    else:
        print("User creation response received, but no user object found (maybe check email confirmation).")

except Exception as e:
    print(f"ERROR: Sign up failed: {e}")
    print("\nIf you see a 500 error, it confirms the database Trigger is crashing.")
    print("You MUST run the 'emergency_fix.sql' in the Supabase Dashboard SQL Editor to remove the broken trigger.")
