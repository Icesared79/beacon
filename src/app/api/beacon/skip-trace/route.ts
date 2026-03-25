import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

const TRACERFY_BASE = 'https://tracerfy.com/v1/api';
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 25;

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

function csvQuote(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function getField(data: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return String(data[key]);
  }
  return undefined;
}

interface SkipTraceResult {
  phones: Array<{ number: string; type: string }>;
  emails: string[];
  mailingAddress: { street: string; city: string; state: string; zip: string } | null;
}

function mapTracerfyRow(data: Record<string, unknown>): SkipTraceResult {
  const phones: SkipTraceResult['phones'] = [];
  const emails: string[] = [];

  const primaryPhone = getField(data, 'primary_phone', 'Primary-phone');
  if (primaryPhone?.trim()) {
    phones.push({ number: primaryPhone.trim(), type: 'Primary' });
  }

  for (let i = 1; i <= 5; i++) {
    const phone = getField(data, `Mobile-${i}`, `mobile_${i}`, `mobile-${i}`);
    if (phone?.trim()) phones.push({ number: phone.trim(), type: 'Mobile' });
  }

  for (let i = 1; i <= 3; i++) {
    const phone = getField(data, `Landline-${i}`, `landline_${i}`, `landline-${i}`);
    if (phone?.trim()) phones.push({ number: phone.trim(), type: 'Landline' });
  }

  for (let i = 1; i <= 5; i++) {
    const email = getField(data, `Email-${i}`, `email_${i}`, `email-${i}`);
    if (email?.trim()) emails.push(email.trim());
  }

  let mailingAddress: SkipTraceResult['mailingAddress'] = null;
  const street = getField(data, 'mail_address', 'mailing_address', 'Mail-address');
  const city = getField(data, 'mail_city', 'mailing_city', 'Mail-city');
  const state = getField(data, 'mail_state', 'mailing_state', 'Mail-state');
  const zip = getField(data, 'mailing_zip', 'mail_zip', 'Mail-zip');
  if (street?.trim()) {
    mailingAddress = {
      street: street.trim(),
      city: (city || '').trim(),
      state: (state || '').trim(),
      zip: (zip || '').trim(),
    };
  }

  return { phones, emails, mailingAddress };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSVToRecords(csvText: string): Record<string, unknown>[] {
  const lines = csvText.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const records: Record<string, unknown>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const values = parseCSVLine(lines[r]);
    const record: Record<string, unknown> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i].trim()] = values[i]?.trim() || '';
    }
    records.push(record);
  }
  return records;
}

async function fetchResultsFromDownload(
  downloadUrl: string,
  apiKey: string
): Promise<Record<string, unknown>[]> {
  try {
    const dlRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!dlRes.ok) return [];
    const contentType = dlRes.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      const dlData = await dlRes.json();
      if (Array.isArray(dlData)) return dlData as Record<string, unknown>[];
      return [];
    } else {
      const csvText = await dlRes.text();
      return parseCSVToRecords(csvText);
    }
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { name, address, city, state, zip } = await req.json();

  const apiKey = process.env.TRACERFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Skip trace not configured' },
      { status: 503 }
    );
  }

  const { firstName, lastName } = parseOwnerName(name);

  // Build single-row CSV for Tracerfy batch API
  const csvHeader = 'first_name,last_name,address,city,state,mail_address,mail_city,mail_state';
  const csvRow = [firstName, lastName, address, city, state, '', '', ''].map(csvQuote).join(',');
  const csvContent = csvHeader + '\n' + csvRow;

  // Submit to Tracerfy
  const formData = new FormData();
  formData.append('csv_file', new Blob([csvContent], { type: 'text/csv' }), 'lookup.csv');
  formData.append('first_name_column', 'first_name');
  formData.append('last_name_column', 'last_name');
  formData.append('address_column', 'address');
  formData.append('city_column', 'city');
  formData.append('state_column', 'state');
  formData.append('mail_address_column', 'mail_address');
  formData.append('mail_city_column', 'mail_city');
  formData.append('mail_state_column', 'mail_state');

  let queueId: string;
  try {
    const submitRes = await fetch(`${TRACERFY_BASE}/trace/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error(`[beacon-skip-trace] Submit failed (${submitRes.status}): ${errText}`);
      return NextResponse.json({ error: 'Contact lookup temporarily unavailable', detail: errText }, { status: 502 });
    }

    const submitData = await submitRes.json();
    console.log('[beacon-skip-trace] Submit response:', JSON.stringify(submitData));
    queueId = String(submitData.queue_id ?? submitData.id ?? '');
    if (!queueId) {
      return NextResponse.json({ error: 'Failed to queue lookup', detail: submitData }, { status: 502 });
    }
  } catch (err) {
    console.error('[beacon-skip-trace] Submit error:', err);
    return NextResponse.json({ error: 'Failed to submit lookup' }, { status: 502 });
  }

  // Poll for results
  let pollResults: Record<string, unknown>[] = [];

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    try {
      const pollRes = await fetch(`${TRACERFY_BASE}/queue/${queueId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!pollRes.ok) {
        console.log(`[beacon-skip-trace] Poll ${attempt + 1}: HTTP ${pollRes.status}`);
        continue;
      }
      const pollData = await pollRes.json();

      if (Array.isArray(pollData) && pollData.length > 0) {
        pollResults = pollData as Record<string, unknown>[];
        break;
      }

      if (pollData && typeof pollData === 'object' && !Array.isArray(pollData)) {
        const obj = pollData as Record<string, unknown>;
        const isPending = obj.pending === true || obj.status === 'pending' || obj.status === 'processing';

        if (!isPending && obj.download_url) {
          pollResults = await fetchResultsFromDownload(obj.download_url as string, apiKey);
          break;
        }

        if (!isPending && !obj.download_url) break;
        continue;
      }

      if (Array.isArray(pollData) && pollData.length === 0) continue;
    } catch {
      // continue polling
    }
  }

  if (pollResults.length === 0) {
    return NextResponse.json({
      phones: [],
      emails: [],
      mailingAddress: null,
    });
  }

  const result = mapTracerfyRow(pollResults[0]);

  return NextResponse.json({
    phones: result.phones,
    emails: result.emails,
    mailingAddress: result.mailingAddress,
  });
}
