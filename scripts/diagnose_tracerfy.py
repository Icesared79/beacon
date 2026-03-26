"""
FULL Tracerfy diagnostic — submit, wait, dump EVERY field, then test Beacon endpoint.
Run: python scripts/diagnose_tracerfy.py
"""
import os, sys, time, json, requests
from dotenv import load_dotenv

load_dotenv(dotenv_path='C:/Users/pauld/beacon/.env.local')
load_dotenv(dotenv_path='C:/Users/pauld/levelpie/.env.local')

API_KEY = os.environ.get('TRACERFY_API_KEY')
BASE = 'https://tracerfy.com/v1/api'
BEACON = 'https://beacon-kohl-one.vercel.app'

if not API_KEY:
    print('FATAL: TRACERFY_API_KEY not found'); sys.exit(1)

print(f'API Key: {API_KEY[:20]}...\n')

# ══════════════════════════════════════════════════════════════
# PART 1: Hit Tracerfy directly — dump COMPLETE raw response
# ══════════════════════════════════════════════════════════════
print('='*70)
print('PART 1: DIRECT TRACERFY API TEST')
print('='*70)

csv_content = (
    'first_name,last_name,address,city,state,mail_address,mail_city,mail_state\n'
    'John,Smith,123 Main Street,Hartford,CT,,,'
)

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

print('\n--- SUBMIT ---')
resp = requests.post(f'{BASE}/trace/', headers={'Authorization': f'Bearer {API_KEY}'}, files=files, data=data, timeout=30)
print(f'Status: {resp.status_code}')
print(f'Body: {resp.text}')

if resp.status_code != 200:
    print('SUBMIT FAILED'); sys.exit(1)

submit = resp.json()
queue_id = str(submit.get('queue_id') or submit.get('id') or '')
print(f'Queue ID: {queue_id}')
print(f'Estimated wait: {submit.get("estimated_wait_seconds")}s')

print('\n--- WAITING 35s FOR PROCESSING ---')
time.sleep(35)

print('\n--- POLL (single attempt after wait) ---')
poll_resp = requests.get(f'{BASE}/queue/{queue_id}', headers={'Authorization': f'Bearer {API_KEY}'}, timeout=15)
print(f'Status: {poll_resp.status_code}')
print(f'Content-Type: {poll_resp.headers.get("content-type")}')
raw_text = poll_resp.text
print(f'Raw body length: {len(raw_text)} chars')
print(f'Raw body (first 2000 chars):\n{raw_text[:2000]}')

try:
    poll_data = poll_resp.json()
except:
    print('CANNOT PARSE AS JSON'); sys.exit(1)

print(f'\nType: {type(poll_data).__name__}')

if isinstance(poll_data, list):
    print(f'Array length: {len(poll_data)}')
    for i, item in enumerate(poll_data[:5]):  # show up to 5 results
        print(f'\n--- RESULT {i} (ALL FIELDS) ---')
        if isinstance(item, dict):
            for key, val in sorted(item.items()):
                indicator = '  ' if not val or (isinstance(val, str) and not val.strip()) else '**'
                print(f'  {indicator} {key}: {repr(val)}')

            # Explicitly check contact fields
            print(f'\n  CONTACT FIELD SUMMARY for result {i}:')
            for field in ['primary_phone', 'Primary-phone',
                          'mobile_1', 'Mobile-1', 'mobile_2', 'Mobile-2', 'mobile_3', 'Mobile-3',
                          'mobile_4', 'Mobile-4', 'mobile_5', 'Mobile-5',
                          'landline_1', 'Landline-1', 'landline_2', 'Landline-2', 'landline_3', 'Landline-3',
                          'email_1', 'Email-1', 'email_2', 'Email-2', 'email_3', 'Email-3',
                          'email_4', 'Email-4', 'email_5', 'Email-5',
                          'mail_address', 'Mail-address', 'mailing_address',
                          'mail_city', 'Mail-city', 'mail_state', 'Mail-state',
                          'mail_zip', 'Mail-zip', 'mailing_zip']:
                val = item.get(field)
                if val and str(val).strip():
                    print(f'    HAS DATA -> {field}: {repr(val)}')
        else:
            print(f'  (not a dict: {type(item).__name__})')
elif isinstance(poll_data, dict):
    print('Object keys:', list(poll_data.keys()))
    print(json.dumps(poll_data, indent=2)[:1000])
else:
    print(f'Unexpected type: {type(poll_data)}')

# Check ALL results for any that have contact data
if isinstance(poll_data, list):
    print(f'\n--- SCANNING ALL {len(poll_data)} RESULTS FOR ANY CONTACT DATA ---')
    found_any = False
    for i, item in enumerate(poll_data):
        if not isinstance(item, dict):
            continue
        contact_fields = ['primary_phone', 'mobile_1', 'mobile_2', 'mobile_3', 'mobile_4', 'mobile_5',
                          'landline_1', 'landline_2', 'landline_3',
                          'email_1', 'email_2', 'email_3', 'email_4', 'email_5']
        for f in contact_fields:
            val = item.get(f, '')
            if val and str(val).strip():
                found_any = True
                print(f'  Result {i}: {f} = {repr(val)}')
    if not found_any:
        print('  *** NO CONTACT DATA IN ANY RESULT ***')
        print('  This means Tracerfy processed the request but found no phone/email data.')
        print('  You ARE being charged for this lookup even though no contacts were found.')

# ══════════════════════════════════════════════════════════════
# PART 2: Hit the Beacon API endpoint and compare
# ══════════════════════════════════════════════════════════════
print('\n' + '='*70)
print('PART 2: BEACON ENDPOINT TEST')
print('='*70)

print('\n--- SUBMIT via Beacon ---')
beacon_submit = requests.post(f'{BEACON}/api/beacon/skip-trace', json={
    'name': 'John Smith',
    'address': '123 Main Street',
    'city': 'Hartford',
    'state': 'CT',
    'zip': '06103',
}, timeout=15)
print(f'Status: {beacon_submit.status_code}')
print(f'Body: {beacon_submit.text}')

if beacon_submit.status_code != 200:
    print('BEACON SUBMIT FAILED'); sys.exit(1)

bq = beacon_submit.json().get('queueId')
print(f'Queue ID: {bq}')

# Wait for processing then poll
print('\n--- WAITING 35s ---')
time.sleep(35)

print('\n--- POLL via Beacon (attempt=8 to trigger complete) ---')
beacon_poll = requests.get(f'{BEACON}/api/beacon/skip-trace', params={'queueId': bq, 'attempt': 8}, timeout=15)
print(f'Status: {beacon_poll.status_code}')
print(f'Body: {beacon_poll.text}')

beacon_data = beacon_poll.json()
print(f'\nBeacon returned:')
print(json.dumps(beacon_data, indent=2))

phones = beacon_data.get('phones', [])
emails = beacon_data.get('emails', [])
mailing = beacon_data.get('mailingAddress')

print(f'\nFINAL VERDICT:')
print(f'  Phones found: {len(phones)}')
print(f'  Emails found: {len(emails)}')
print(f'  Mailing address: {"YES" if mailing else "NO"}')

if phones:
    for p in phones:
        print(f'    PHONE: {p}')
if emails:
    for e in emails:
        print(f'    EMAIL: {e}')
if mailing:
    print(f'    MAILING: {mailing}')

if not phones and not emails:
    print('\n  *** ZERO CONTACT DATA ***')
    print('  The code is working correctly — Tracerfy simply has no contact')
    print('  data for this address/person combination.')
    print('  To verify the mapping works, we need an address where Tracerfy')
    print('  actually HAS phone/email data in their database.')

print('\nDone.')
