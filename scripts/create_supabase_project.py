"""
Create the Beacon Supabase project via Management API.
Run: python scripts/create_supabase_project.py

If this fails, create the project manually at https://supabase.com/dashboard
and update .env.local with the project URL and keys.
"""
import requests
import os
import sys
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.environ.get('SUPABASE_ACCESS_TOKEN')
if not ACCESS_TOKEN:
    print("ERROR: SUPABASE_ACCESS_TOKEN not set in environment")
    sys.exit(1)

# First get the org ID
orgs = requests.get(
    'https://api.supabase.com/v1/organizations',
    headers={'Authorization': f'Bearer {ACCESS_TOKEN}'}
)
orgs_data = orgs.json()
if not orgs_data:
    print("ERROR: No organizations found")
    sys.exit(1)

org_id = orgs_data[0]['id']
print(f"Using org: {orgs_data[0].get('name', org_id)}")

# Create new Supabase project for Beacon
resp = requests.post(
    'https://api.supabase.com/v1/projects',
    headers={
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    },
    json={
        'name': 'beacon',
        'organization_id': org_id,
        'plan': 'free',
        'region': 'us-east-1',
        'db_pass': 'BeaconSecure2026!'
    }
)

data = resp.json()
print(f"Status: {resp.status_code}")
print(f"Response: {data}")

if resp.status_code in (200, 201):
    project_id = data.get('id')
    print(f"\nProject created! ID: {project_id}")
    print(f"URL: https://{project_id}.supabase.co")
    print(f"\nNext: Get API keys from Supabase dashboard and update .env.local")
else:
    print("\nFailed to create project. Create manually at https://supabase.com/dashboard")
