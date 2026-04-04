import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')

client = create_client(url, key)

users = [
    {'email': 'bestfriendsforever17co@gmail.com', 'id': 'c9d59104-24d2-4357-b0f5-461fe43328d4', 'name': 'Dhruv Save'},
    {'email': 'bingostingo1@gmail.com', 'id': 'bfd89b7c-8a49-4918-87b6-7316da4e8298', 'name': 'Bingo Stingo'}
]

for u in users:
    try:
        profile_data = {
            "id": u['id'],
            "full_name": u['name'],
            "role": "user"
        }
        res = client.table("profiles").upsert(profile_data).execute()
        print(f"Profile upserted for {u['email']}")
    except Exception as e:
        print(f"Error upserting profile: {e}")
