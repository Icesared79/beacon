"""
Test the Beacon skip-trace endpoint end-to-end.
This hits the actual deployed Vercel endpoint.
"""
import time
import json
import requests

BEACON_URL = 'https://beacon-kohl-one.vercel.app'

# Step 1: Submit
print('=== SUBMIT ===')
submit_resp = requests.post(
    f'{BEACON_URL}/api/beacon/skip-trace',
    json={
        'name': 'John Smith',
        'address': '123 Main Street',
        'city': 'Hartford',
        'state': 'CT',
        'zip': '06103',
    },
    timeout=15,
)
print(f'Status: {submit_resp.status_code}')
print(f'Body: {submit_resp.text[:500]}')

if submit_resp.status_code != 200:
    print(f'\nSUBMIT FAILED with status {submit_resp.status_code}')
    print('This means the API route is returning an error.')
    if submit_resp.status_code == 503:
        print('>>> TRACERFY_API_KEY is not set in Vercel environment!')
    exit(1)

submit_data = submit_resp.json()
queue_id = submit_data.get('queueId')
if not queue_id:
    print(f'\nNo queueId in response: {submit_data}')
    exit(1)

print(f'Queue ID: {queue_id}')

# Step 2: Poll (like the client would)
print('\n=== POLLING ===')
for attempt in range(15):
    time.sleep(4)
    print(f'Poll attempt={attempt}...')

    poll_resp = requests.get(
        f'{BEACON_URL}/api/beacon/skip-trace',
        params={'queueId': queue_id, 'attempt': attempt},
        timeout=15,
    )
    print(f'  Status: {poll_resp.status_code}')
    print(f'  Body: {poll_resp.text[:300]}')

    try:
        poll_data = poll_resp.json()
        if poll_data.get('status') == 'complete':
            print(f'\n*** COMPLETE ***')
            print(json.dumps(poll_data, indent=2))
            phones = poll_data.get('phones', [])
            emails = poll_data.get('emails', [])
            addr = poll_data.get('mailingAddress')
            print(f'\nPhones: {len(phones)}')
            print(f'Emails: {len(emails)}')
            print(f'Mailing Address: {addr}')
            break
    except:
        pass

print('\nDone.')
