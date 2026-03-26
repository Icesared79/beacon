"""
Broader probe — try different base paths and the doc URL hint.
"""
import os, json, requests
from dotenv import load_dotenv

load_dotenv(dotenv_path='C:/Users/pauld/beacon/.env.local')
API_KEY = os.environ.get('TRACERFY_API_KEY')
AUTH = {'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'}

payload = {
    'first_name': 'John',
    'last_name': 'Smith',
    'address': '123 Main Street',
    'city': 'Hartford',
    'state': 'CT',
    'zip': '06103',
}

bases = [
    'https://tracerfy.com/api',
    'https://tracerfy.com/api/v1',
    'https://tracerfy.com/api/v2',
    'https://tracerfy.com/v2/api',
    'https://api.tracerfy.com',
    'https://api.tracerfy.com/v1',
    'https://api.tracerfy.com/v2',
    'https://tracerfy.com/v1/api',
]

paths = [
    '/instant-trace',
    '/instant-trace/',
    '/instant_trace',
    '/instant_trace/',
    '/single-trace',
    '/single-trace/',
    '/single_trace',
    '/trace/single',
    '/trace/single/',
    '/trace-single',
    '/skip-trace',
    '/skip-trace/',
    '/trace',
    '/trace/',
]

print(f'Testing {len(bases) * len(paths)} combinations...\n')

for base in bases:
    for path in paths:
        url = base + path
        try:
            resp = requests.post(url, headers=AUTH, json=payload, timeout=8)
            if resp.status_code != 404:
                print(f'*** {resp.status_code} POST {url}')
                print(f'    {resp.text[:400]}\n')
        except requests.exceptions.ConnectionError:
            pass
        except Exception as e:
            if '404' not in str(e):
                print(f'ERR POST {url}: {e}')

# Also: the doc page may have the actual endpoint in it — fetch it
print('\n--- Fetching API doc page for endpoint clues ---')
try:
    doc = requests.get('https://tracerfy.com/skip-tracing-api-documentation/', timeout=10,
                       headers={'User-Agent': 'Mozilla/5.0'})
    text = doc.text

    # Find all API endpoint references
    import re
    urls = re.findall(r'https?://[^\s"\'<>]+(?:instant|single|trace|api)[^\s"\'<>]*', text)
    for u in set(urls):
        print(f'  Found URL: {u}')

    # Find code blocks that might contain endpoint info
    code_blocks = re.findall(r'<code[^>]*>(.*?)</code>', text, re.DOTALL)
    for block in code_blocks:
        if 'instant' in block.lower() or 'trace' in block.lower() or 'api' in block.lower():
            clean = block.strip()[:300]
            if clean:
                print(f'  Code: {clean}')

    # Look for curl examples
    curls = re.findall(r'curl[^<]*', text)
    for c in curls:
        print(f'  Curl: {c[:300]}')

except Exception as e:
    print(f'  Error fetching docs: {e}')

print('\nDone.')
