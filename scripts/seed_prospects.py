"""
Seed Beacon prospects from Atlas signals.
Run: python scripts/seed_prospects.py

Requires:
- SUPABASE_ACCESS_TOKEN in .env
- BEACON_SUPABASE_URL and BEACON_SERVICE_KEY in .env
"""
import requests
import os
import sys
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.environ.get('SUPABASE_ACCESS_TOKEN')
ATLAS_PROJECT = 'urxfibjfbzkcnxhyynpb'
BEACON_URL = os.environ.get('BEACON_SUPABASE_URL')
BEACON_KEY = os.environ.get('BEACON_SERVICE_KEY')

if not ACCESS_TOKEN:
    print("ERROR: SUPABASE_ACCESS_TOKEN not set")
    sys.exit(1)

if not BEACON_URL or not BEACON_KEY:
    print("ERROR: BEACON_SUPABASE_URL and BEACON_SERVICE_KEY must be set")
    sys.exit(1)


def query_atlas(sql, timeout=120):
    resp = requests.post(
        f'https://api.supabase.com/v1/projects/{ATLAS_PROJECT}/database/query',
        headers={
            'Authorization': f'Bearer {ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        },
        json={'query': sql},
        timeout=timeout
    )
    return resp.json()


# Pull top 500 signal-ready properties from ACCC markets
print("Pulling prospects from Atlas...")
prospects = query_atlas('''
    SELECT
        ap.parcel_id,
        ap.address,
        ap.city,
        ap.state,
        ap.zip,
        ap.county,
        ap.latitude,
        ap.longitude,
        ap.owner_name,
        ap.total_assessed_value,
        ap.last_sale_price,
        ap.last_sale_date,
        EXTRACT(YEAR FROM AGE(NOW(), ap.last_sale_date)) as years_held,
        ap.total_assessed_value - COALESCE(ap.last_sale_price, 0) as estimated_equity,
        COUNT(DISTINCT ps.signal_type) as signal_count,
        MAX(ps.confidence) as max_confidence,
        BOOL_OR(ps.signal_type = 'long_hold_confirmed') as is_long_hold,
        BOOL_OR(ps.signal_type = 'high_equity_confirmed') as is_high_equity,
        BOOL_OR(ps.signal_type = 'distress_flagged') as has_distress,
        MIN(ps.detected_at) as first_signal_date,
        MAX(ps.detected_at) as most_recent_signal_date
    FROM atlas_properties ap
    JOIN atlas_property_signals ps ON ap.parcel_id = ps.parcel_id
    WHERE ap.state IN ('CO', 'GA', 'PA', 'IL', 'MA', 'TX', 'FL', 'MI')
    AND ap.address IS NOT NULL
    AND ap.owner_name IS NOT NULL
    GROUP BY ap.parcel_id, ap.address, ap.city, ap.state, ap.zip,
             ap.county, ap.latitude, ap.longitude, ap.owner_name,
             ap.total_assessed_value, ap.last_sale_price, ap.last_sale_date
    ORDER BY signal_count DESC, max_confidence DESC
    LIMIT 500
''')

print(f'Pulled {len(prospects)} prospects from Atlas')

# Write to Beacon Supabase
from supabase import create_client
beacon_sb = create_client(BEACON_URL, BEACON_KEY)

inserted = 0
for p in prospects:
    score = 0
    if p.get('is_long_hold'):
        score += 25
    if p.get('is_high_equity'):
        score += 25
    if p.get('has_distress'):
        score += 35
    score += min(15, p.get('signal_count', 0) * 5)

    beacon_sb.table('beacon_prospects').upsert({
        'address': p.get('address'),
        'city': p.get('city'),
        'state': p.get('state'),
        'zip': p.get('zip'),
        'county': p.get('county'),
        'latitude': p.get('latitude'),
        'longitude': p.get('longitude'),
        'owner_name': p.get('owner_name'),
        'assessed_value': p.get('total_assessed_value'),
        'last_sale_price': p.get('last_sale_price'),
        'last_sale_date': str(p.get('last_sale_date')) if p.get('last_sale_date') else None,
        'years_held': p.get('years_held'),
        'estimated_equity': p.get('estimated_equity'),
        'compound_score': score,
        'signal_count': p.get('signal_count'),
        'is_long_hold': p.get('is_long_hold'),
        'is_high_equity': p.get('is_high_equity'),
        'has_tax_delinquency': p.get('has_distress'),
        'first_signal_date': str(p.get('first_signal_date'))[:10] if p.get('first_signal_date') else None,
        'most_recent_signal_date': str(p.get('most_recent_signal_date'))[:10] if p.get('most_recent_signal_date') else None,
        'atlas_parcel_id': p.get('parcel_id'),
        'status': 'new',
        'source': 'atlas',
    }).execute()
    inserted += 1

print(f'Beacon prospects seeded: {inserted} records')
