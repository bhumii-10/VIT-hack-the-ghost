#!/usr/bin/env python3
"""
Database migration script to add location columns
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Run the location columns migration"""
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials in .env file")
        return False
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("🔗 Connected to Supabase")
        
        # Test current schema by trying to select from profiles
        result = supabase.table('profiles').select('id, last_latitude, last_longitude').limit(1).execute()
        print(f"✅ Current profiles table accessible, found {len(result.data)} records")
        
        # Check if the new columns already exist by trying to select them
        try:
            test_result = supabase.table('profiles').select('last_location_accuracy, last_location_timestamp').limit(1).execute()
            print("✅ Location accuracy and timestamp columns already exist!")
            return True
        except Exception as e:
            print("📋 Location accuracy and timestamp columns need to be added")
            print(f"   Error: {str(e)}")
        
        print("\n🔧 MANUAL MIGRATION REQUIRED:")
        print("Since Supabase doesn't allow DDL operations from the client,")
        print("please run this SQL in your Supabase SQL Editor:")
        print("\n" + "="*60)
        print("ALTER TABLE profiles")
        print("ADD COLUMN IF NOT EXISTS last_location_accuracy FLOAT,")
        print("ADD COLUMN IF NOT EXISTS last_location_timestamp TIMESTAMP WITH TIME ZONE;")
        print("="*60)
        print("\nSteps:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to SQL Editor")
        print("4. Paste and run the SQL above")
        print("5. Refresh your app")
        
        return False
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("\n🎉 Migration completed successfully!")
    else:
        print("\n⚠️  Manual migration required - see instructions above")
    
    sys.exit(0 if success else 1)