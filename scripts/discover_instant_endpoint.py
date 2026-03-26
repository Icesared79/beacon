"""
Discover Tracerfy instant trace endpoint format.
"""
import os, json, requests
from dotenv import load_dotenv

load_dotenv(dotenv_path='C:/Users/pauld/beacon/.env.local')
API_KEY = os.environ.get('TRACERFY_API_KEY')
BASE = 'https://tracerfy.com/v1/api'
HEADERS = {'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'}

print(f'API Key: {API_KEY[:20]}...\n')

# Test data
payload = {
    'first_name': 'John',
    'last_name': 'Smith',
    'address': '123 Main Street',
    'city': 'Hartford',
    'state': 'CT',
    'zip': '06103',
}

# Probe candidate endpoints
candidates = [
    ('POST', f'{BASE}/instant-trace/', payload),
    ('POST', f'{BASE}/instant-trace', payload),
    ('POST', f'{BASE}/instant/', payload),
    ('POST', f'{BASE}/instant', payload),
    ('POST', f'{BASE}/search/', payload),
    ('POST', f'{BASE}/search', payload),
    ('POST', f'{BASE}/trace/instant/', payload),
    ('POST', f'{BASE}/trace/instant', payload),
    ('POST', f'{BASE}/person/', payload),
    ('POST', f'{BASE}/person/search/', payload),
    ('POST', f'{BASE}/lookup/', payload),
    ('POST', f'{BASE}/lookup', payload),
    ('GET', f'{BASE}/instant-trace/', None),
    ('GET', f'{BASE}/instant-trace', None),
]

for method, url, body in candidates:
    try:
        if method == 'POST':
            resp = requests.post(url, headers=HEADERS, json=body, timeout=10)
        else:
            resp = requests.get(url, headers=HEADERS, params=payload, timeout=10)

        status = resp.status_code
        text = resp.text[:300]

        # Skip 404s and method not allowed
        if status in (404, 405):
            print(f'  {status} {method} {url}')
            continue

        print(f'\n*** {status} {method} {url}')
        print(f'    Response: {text}')

        if status == 200:
            print(f'    *** FOUND WORKING ENDPOINT ***')
            try:
                data = resp.json()
                print(f'    Full response:\n{json.dumps(data, indent=2)[:2000]}')
            except:
                pass
    except Exception as e:
        print(f'  ERR {method} {url}: {e}')

# Also try with different auth header styles
print('\n\n--- Testing auth header variations on /instant-trace/ ---')
for header_style in [
    {'Authorization': f'Bearer {API_KEY}'},
    {'Authorization': f'Token {API_KEY}'},
    {'X-API-Key': API_KEY},
    {'api-key': API_KEY},
]:
    try:
        h = {**header_style, 'Content-Type': 'application/json'}
        resp = requests.post(f'{BASE}/instant-trace/', headers=h, json=payload, timeout=10)
        auth_type = list(header_style.keys())[0]
        print(f'  {resp.status_code} {auth_type}: {resp.text[:200]}')
    except Exception as e:
        print(f'  ERR: {e}')

print('\nDone.')
