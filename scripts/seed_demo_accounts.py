"""
Seed demo accounts for the Beacon ACCC presentation.

Usage:
  python scripts/seed_demo_accounts.py

Requires BEACON_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
and BEACON_SERVICE_KEY / SUPABASE_SERVICE_KEY in environment or .env
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

BEACON_URL = os.environ.get('BEACON_SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
BEACON_KEY = os.environ.get('BEACON_SERVICE_KEY') or os.environ.get('SUPABASE_SERVICE_KEY')

if not BEACON_URL or not BEACON_KEY:
    print('ERROR: Missing BEACON_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or BEACON_SERVICE_KEY/SUPABASE_SERVICE_KEY')
    exit(1)

sb = create_client(BEACON_URL, BEACON_KEY)

accounts = [
    {
        'email': 'demo@consumercredit.com',
        'password': 'BeaconDemo2026!',
        'full_name': 'ACCC Demo User',
        'role': 'counselor',
        'office_location': 'Boston',
    },
    {
        'email': 'admin@consumercredit.com',
        'password': 'BeaconAdmin2026!',
        'full_name': 'ACCC Administrator',
        'role': 'admin',
        'office_location': 'Boston',
    },
]

for account in accounts:
    result = sb.auth.admin.create_user({
        'email': account['email'],
        'password': account['password'],
        'email_confirm': True,
    })
    print(f"Created auth user: {account['email']}")

    if result.user:
        sb.table('beacon_users').insert({
            'id': result.user.id,
            'email': account['email'],
            'full_name': account['full_name'],
            'role': account['role'],
            'office_location': account['office_location'],
        }).execute()
        print(f"Created beacon user record: {account['full_name']}")

print('\nDemo credentials:')
print('Counselor: demo@consumercredit.com / BeaconDemo2026!')
print('Admin: admin@consumercredit.com / BeaconAdmin2026!')
