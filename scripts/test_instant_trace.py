"""
Test the correct Tracerfy instant trace endpoint: /v1/api/trace/lookup/
"""
import os, json, requests
from dotenv import load_dotenv

load_dotenv(dotenv_path='C:/Users/pauld/beacon/.env.local')
API_KEY = os.environ.get('TRACERFY_API_KEY')
BASE = 'https://tracerfy.com/v1/api'

print(f'API Key: {API_KEY[:20]}...\n')

# Test 1: Owner lookup with find_owner=true
print('=== TEST 1: Owner lookup (find_owner=true) ===')
resp = requests.post(f'{BASE}/trace/lookup/', headers={
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
}, json={
    'address': '123 Main Street',
    'city': 'Hartford',
    'state': 'CT',
    'zip': '06103',
    'find_owner': True,
}, timeout=30)
print(f'Status: {resp.status_code}')
print(f'Response:\n{json.dumps(resp.json(), indent=2) if resp.status_code == 200 else resp.text[:500]}')

# Test 2: Person lookup with name
print('\n=== TEST 2: Person lookup (with name) ===')
resp2 = requests.post(f'{BASE}/trace/lookup/', headers={
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
}, json={
    'first_name': 'John',
    'last_name': 'Smith',
    'address': '123 Main Street',
    'city': 'Hartford',
    'state': 'CT',
    'zip': '06103',
}, timeout=30)
print(f'Status: {resp2.status_code}')
raw = resp2.json() if resp2.status_code == 200 else None
if raw:
    print(f'Response:\n{json.dumps(raw, indent=2)[:3000]}')

    # Dump ALL keys and which ones have data
    print('\n--- ALL FIELDS ---')
    if isinstance(raw, dict):
        for key, val in sorted(raw.items()):
            has = bool(val and str(val).strip()) if not isinstance(val, (dict, list)) else bool(val)
            indicator = '**' if has else '  '
            print(f'  {indicator} {key}: {repr(val)}')
    elif isinstance(raw, list) and len(raw) > 0:
        item = raw[0]
        for key, val in sorted(item.items()):
            has = bool(val and str(val).strip()) if not isinstance(val, (dict, list)) else bool(val)
            indicator = '**' if has else '  '
            print(f'  {indicator} {key}: {repr(val)}')
else:
    print(f'Response: {resp2.text[:500]}')

# Test 3: Person lookup with a more likely-to-match scenario
print('\n=== TEST 3: Another address ===')
resp3 = requests.post(f'{BASE}/trace/lookup/', headers={
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
}, json={
    'first_name': 'Robert',
    'last_name': 'Johnson',
    'address': '456 Oak Avenue',
    'city': 'Chicago',
    'state': 'IL',
    'zip': '60601',
}, timeout=30)
print(f'Status: {resp3.status_code}')
if resp3.status_code == 200:
    data = resp3.json()
    print(f'Response:\n{json.dumps(data, indent=2)[:3000]}')
else:
    print(f'Response: {resp3.text[:500]}')

print('\nDone.')
