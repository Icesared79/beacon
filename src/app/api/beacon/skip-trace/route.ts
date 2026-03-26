import { NextRequest, NextResponse } from 'next/server';

const TRACERFY_BASE = 'https://tracerfy.com/v1/api';

// ──────────────────────────────────────────────────────────────────
// Tracerfy Instant Trace — /trace/lookup/
// Synchronous single-lookup endpoint. Returns results immediately.
// No CSV upload, no polling, no queue IDs.
// ──────────────────────────────────────────────────────────────────

interface TracerfyPhone {
  number: string;
  type: string;
  dnc: boolean;
  carrier?: string;
  rank?: number;
}

interface TracerfyEmail {
  email: string;
  rank?: number;
}

interface TracerfyPerson {
  first_name: string;
  last_name: string;
  full_name: string;
  dob?: string;
  age?: string;
  deceased?: boolean;
  property_owner?: boolean;
  litigator?: boolean;
  mailing_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phones?: TracerfyPhone[];
  emails?: TracerfyEmail[];
}

interface TracerfyLookupResponse {
  address: string;
  city: string;
  state: string;
  zip: string;
  hit: boolean;
  persons_count: number;
  credits_deducted: number;
  persons: TracerfyPerson[];
}

function parseOwnerName(ownerName: string): { firstName: string; lastName: string } {
  const trimmed = ownerName.trim();
  if (trimmed.includes(',')) {
    const [last, first] = trimmed.split(',').map((s) => s.trim());
    return { firstName: first || last, lastName: last };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts[parts.length - 1] };
}

function mapPersonToResult(person: TracerfyPerson) {
  const phones = (person.phones || []).map((p) => ({
    number: p.number,
    type: p.type || 'Unknown',
    dnc: p.dnc ?? false,
    carrier: p.carrier || '',
  }));

  const emails = (person.emails || []).map((e) => e.email).filter(Boolean);

  const mailingAddress = person.mailing_address?.street
    ? {
        street: person.mailing_address.street,
        city: person.mailing_address.city || '',
        state: person.mailing_address.state || '',
        zip: person.mailing_address.zip || '',
      }
    : null;

  return {
    name: person.full_name || `${person.first_name} ${person.last_name}`,
    deceased: person.deceased ?? false,
    propertyOwner: person.property_owner ?? false,
    phones,
    emails,
    mailingAddress,
  };
}

// ──────────────────────────────────────────────────────────────────
// POST — Single instant lookup via /trace/lookup/
// Returns results synchronously — no polling needed.
// ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { name, address, city, state, zip } = await req.json();

  const apiKey = process.env.TRACERFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Skip trace not configured' }, { status: 503 });
  }

  if (!address || !city || !state) {
    return NextResponse.json({ error: 'address, city, and state are required' }, { status: 400 });
  }

  const { firstName, lastName } = parseOwnerName(name || '');

  // Build the instant lookup payload
  const lookupPayload: Record<string, unknown> = {
    address,
    city,
    state,
    zip: zip || '',
    find_owner: true,
  };

  // Include name if available — helps Tracerfy match
  if (firstName && firstName !== lastName) {
    lookupPayload.first_name = firstName;
    lookupPayload.last_name = lastName;
  }

  console.log('[skip-trace] Instant lookup request:', JSON.stringify(lookupPayload));

  try {
    const res = await fetch(`${TRACERFY_BASE}/trace/lookup/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lookupPayload),
    });

    const rawText = await res.text();
    console.log(`[skip-trace] Tracerfy response status: ${res.status}`);
    console.log(`[skip-trace] Tracerfy raw response: ${rawText.substring(0, 500)}`);

    if (!res.ok) {
      console.error(`[skip-trace] Tracerfy error (${res.status}): ${rawText}`);
      return NextResponse.json({ error: 'Contact lookup temporarily unavailable' }, { status: 502 });
    }

    let data: TracerfyLookupResponse;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[skip-trace] Failed to parse Tracerfy response');
      return NextResponse.json({ error: 'Invalid response from lookup service' }, { status: 502 });
    }

    console.log(`[skip-trace] hit=${data.hit}, persons=${data.persons_count}, credits=${data.credits_deducted}`);

    if (!data.hit || !data.persons || data.persons.length === 0) {
      return NextResponse.json({
        status: 'complete',
        hit: false,
        persons: [],
        phones: [],
        emails: [],
        mailingAddress: null,
      });
    }

    // Map all persons
    const persons = data.persons.map(mapPersonToResult);

    // Flatten the first (best-ranked) person for backward-compatible fields
    const primary = persons[0];

    return NextResponse.json({
      status: 'complete',
      hit: true,
      personsCount: data.persons_count,
      creditsUsed: data.credits_deducted,
      persons,
      // Flat fields from primary person for simple UI consumption
      phones: primary.phones,
      emails: primary.emails,
      mailingAddress: primary.mailingAddress,
    });
  } catch (err) {
    console.error('[skip-trace] Lookup error:', err);
    return NextResponse.json({ error: 'Failed to complete lookup' }, { status: 502 });
  }
}
