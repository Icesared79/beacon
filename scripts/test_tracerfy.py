"""
Test Tracerfy API directly to verify the key works and see response format.
Run: python scripts/test_tracerfy.py
"""
import os
import time
import json
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path='C:/Users/pauld/levelpie/.env.local')
load_dotenv()  # also check local .env

API_KEY = os.environ.get('TRACERFY_API_KEY')
BASE = 'https://tracerfy.com/v1/api'

if not API_KEY:
    print('ERROR: TRACERFY_API_KEY not found')
    exit(1)

print(f'API Key: {API_KEY[:20]}...')

# Build a single-row CSV
csv_content = (
    'first_name,last_name,address,city,state,mail_address,mail_city,mail_state\n'
    'Robert,Fischer,1847 Elm Street,Denver,CO,,,'
)

# Step 1: Submit
print('\n--- SUBMIT ---')
files = {'csv_file': ('lookup.csv', csv_content, 'text/csv')}
data = {
    'first_name_column': 'first_name',
    'last_name_column': 'last_name',
    'address_column': 'address',
    'city_column': 'city',
    'state_column': 'state',
    'mail_address_column': 'mail_address',
    'mail_city_column': 'mail_city',
    'mail_state_column': 'mail_state',
}

resp = requests.post(
    f'{BASE}/trace/',
    headers={'Authorization': f'Bearer {API_KEY}'},
    files=files,
    data=data,
    timeout=30,
)
print(f'Status: {resp.status_code}')
print(f'Response: {resp.text[:500]}')

if resp.status_code != 200:
    print('SUBMIT FAILED — stopping')
    exit(1)

submit_data = resp.json()
queue_id = str(submit_data.get('queue_id') or submit_data.get('id') or '')
print(f'Queue ID: {queue_id}')

if not queue_id:
    print('No queue_id in response — stopping')
    exit(1)

# Step 2: Poll
print('\n--- POLLING ---')
for attempt in range(20):
    time.sleep(4)
    print(f'Poll {attempt + 1}...')

    poll_resp = requests.get(
        f'{BASE}/queue/{queue_id}',
        headers={'Authorization': f'Bearer {API_KEY}'},
        timeout=15,
    )
    print(f'  Status: {poll_resp.status_code}')
    poll_text = poll_resp.text[:600]
    print(f'  Body: {poll_text}')

    try:
        poll_data = poll_resp.json()
    except:
        continue

    # Check if done
    if isinstance(poll_data, list) and len(poll_data) > 0:
        print(f'\nGOT RESULTS (array with {len(poll_data)} items)')
        print(json.dumps(poll_data[0], indent=2)[:800])
        break

    if isinstance(poll_data, dict):
        is_pending = poll_data.get('pending') == True or poll_data.get('status') in ('pending', 'processing')
        if not is_pending and 'download_url' in poll_data:
            print(f'\nGOT DOWNLOAD URL: {poll_data["download_url"]}')
            dl_resp = requests.get(
                poll_data['download_url'],
                headers={'Authorization': f'Bearer {API_KEY}'},
                timeout=15,
            )
            print(f'  Download status: {dl_resp.status_code}')
            print(f'  Download body: {dl_resp.text[:600]}')
            break
        if not is_pending:
            print(f'\nCOMPLETE but no download_url: {json.dumps(poll_data, indent=2)[:400]}')
            break
        # still pending, continue

print('\nDone.')
