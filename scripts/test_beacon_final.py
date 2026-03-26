"""
Final end-to-end test — hit the live Beacon endpoint with the new instant trace.
"""
import json, requests

BEACON = 'https://beacon-kohl-one.vercel.app'

print('=== BEACON ENDPOINT — INSTANT TRACE ===\n')

resp = requests.post(f'{BEACON}/api/beacon/skip-trace', json={
    'name': 'John Smith',
    'address': '123 Main Street',
    'city': 'Hartford',
    'state': 'CT',
    'zip': '06103',
}, timeout=30)

print(f'Status: {resp.status_code}')
data = resp.json()
print(f'Response:\n{json.dumps(data, indent=2)[:3000]}')

if resp.status_code == 200:
    print(f'\n=== RESULTS ===')
    print(f'Hit: {data.get("hit")}')
    phones = data.get('phones', [])
    emails = data.get('emails', [])
    mailing = data.get('mailingAddress')
    print(f'Phones: {len(phones)}')
    for p in phones:
        print(f'  {p["number"]} ({p["type"]})')
    print(f'Emails: {len(emails)}')
    for e in emails:
        print(f'  {e}')
    if mailing:
        print(f'Mailing: {mailing["street"]}, {mailing["city"]} {mailing["state"]} {mailing["zip"]}')
else:
    print(f'\nFAILED: {data}')

print('\nDone.')
