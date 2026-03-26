"""
Enhanced Tracerfy test — tries a real public address and probes response format.
Run: python scripts/test_tracerfy_v2.py
"""
import os
import time
import json
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path='C:/Users/pauld/beacon/.env.local')

API_KEY = os.environ.get('TRACERFY_API_KEY')
BASE = 'https://tracerfy.com/v1/api'

if not API_KEY:
    print('ERROR: TRACERFY_API_KEY not found')
    exit(1)

print(f'API Key: {API_KEY[:20]}...')

# ── Check account/credits ──
print('\n=== CHECKING ACCOUNT ===')
for endpoint in ['/account', '/account/', '/credits', '/credits/', '/balance', '/user', '/user/']:
    try:
        r = requests.get(f'{BASE}{endpoint}', headers={'Authorization': f'Bearer {API_KEY}'}, timeout=10)
        print(f'  {endpoint}: {r.status_code} → {r.text[:200]}')
    except Exception as e:
        print(f'  {endpoint}: ERROR {e}')

# ── Test with a well-known public/commercial address ──
# Using a real commercial address (public record, not PII)
csv_content = (
    'first_name,last_name,address,city,state,mail_address,mail_city,mail_state\n'
    'John,Smith,123 Main Street,Hartford,CT,,,'
)

print('\n=== SUBMIT ===')
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
print(f'Headers: {dict(resp.headers)}')
print(f'Response: {resp.text[:800]}')

if resp.status_code != 200:
    print('SUBMIT FAILED')
    exit(1)

submit_data = resp.json()
queue_id = str(submit_data.get('queue_id') or submit_data.get('id') or '')
print(f'Queue ID: {queue_id}')

# ── Check alternative result endpoints ──
print('\n=== CHECKING ALTERNATIVE ENDPOINTS ===')
for alt in [
    f'/queue/{queue_id}',
    f'/queue/{queue_id}/',
    f'/queue/{queue_id}/results',
    f'/queue/{queue_id}/download',
    f'/trace/{queue_id}',
    f'/trace/{queue_id}/',
    f'/trace/{queue_id}/results',
    f'/results/{queue_id}',
]:
    try:
        r = requests.get(f'{BASE}{alt}', headers={'Authorization': f'Bearer {API_KEY}'}, timeout=10)
        body = r.text[:300]
        print(f'  GET {alt}: {r.status_code} → {body}')
    except Exception as e:
        print(f'  GET {alt}: ERROR {e}')

# ── Poll the standard queue endpoint ──
print('\n=== POLLING (waiting 30s, then checking every 5s) ===')
print('Waiting 30s for trace to complete...')
time.sleep(30)

for attempt in range(12):
    print(f'Poll {attempt + 1}...')
    poll_resp = requests.get(
        f'{BASE}/queue/{queue_id}',
        headers={'Authorization': f'Bearer {API_KEY}'},
        timeout=15,
    )
    print(f'  Status: {poll_resp.status_code}')
    print(f'  Content-Type: {poll_resp.headers.get("content-type", "?")}')
    body = poll_resp.text[:500]
    print(f'  Body: {body}')

    try:
        poll_data = poll_resp.json()
        if isinstance(poll_data, list) and len(poll_data) > 0:
            print(f'\n*** GOT RESULTS ({len(poll_data)} items) ***')
            print(json.dumps(poll_data[0], indent=2)[:1000])
            break
        if isinstance(poll_data, dict) and not poll_data.get('pending') and poll_data.get('download_url'):
            print(f'\n*** GOT DOWNLOAD URL ***')
            print(json.dumps(poll_data, indent=2)[:500])
            dl = requests.get(poll_data['download_url'], headers={'Authorization': f'Bearer {API_KEY}'}, timeout=15)
            print(f'  Download: {dl.status_code} → {dl.text[:500]}')
            break
        if isinstance(poll_data, dict) and poll_data.get('status') not in ('pending', 'processing'):
            print(f'\n*** STATUS CHANGED ***')
            print(json.dumps(poll_data, indent=2)[:500])
            break
    except:
        pass

    time.sleep(5)

print('\nDone.')
