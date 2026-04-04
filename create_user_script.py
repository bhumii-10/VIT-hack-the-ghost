import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')

if not url or not key:
    print('Error loading env')
    exit(1)

client = create_client(url, key)

users = [
    {'email': 'bestfriendsforever17co@gmail.com', 'password': 'Dhruvsave', 'name': 'Dhruv Save'},
    {'email': 'bingostingo1@gmail.com', 'password': 'bingostingo1', 'name': 'Bingo Stingo'}
]

for u in users:
    print(f"Signing up {u['email']}...")
    try:
        res = client.auth.sign_up({
            'email': u['email'],
            'password': u['password'],
            'options': { 'data': { 'full_name': u['name'], 'role': 'user' } }
        })
        print(f"Success: {res.user.id if res.user else 'Already registered or requires email confirm'}")
    except Exception as e:
        print(f"Error: {e}")
