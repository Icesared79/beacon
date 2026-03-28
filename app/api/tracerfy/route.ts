// Tracerfy instant trace endpoint only — never batch
// Endpoint: POST https://tracerfy.com/v1/api/trace/lookup/
// Triggered exclusively by user button press in ContactLookup component
// API key: TRACERFY_API_KEY in environment variables (server-side only)
// Cost: 5 credits per hit, 0 credits on miss

import { NextRequest, NextResponse } from 'next/server'

const TRACERFY_ENDPOINT = 'https://tracerfy.com/v1/api/trace/lookup/'

export async function POST(req: NextRequest) {
  const apiKey = process.env.TRACERFY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: true, message: 'Tracerfy API key not configured' },
      { status: 500 }
    )
  }

  let body: { address: string; city: string; state: string; zip?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: true, message: 'Invalid request body' },
      { status: 400 }
    )
  }

  if (!body.address || !body.city || !body.state) {
    return NextResponse.json(
      { error: true, message: 'address, city, and state are required' },
      { status: 400 }
    )
  }

  console.log(
    `[Tracerfy] Instant trace lookup: ${body.address}, ${body.city}, ${body.state}` +
    (body.zip ? ` ${body.zip}` : '')
  )

  try {
    const res = await fetch(TRACERFY_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: body.address,
        city: body.city,
        state: body.state,
        ...(body.zip ? { zip: body.zip } : {}),
        find_owner: true,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[Tracerfy] API error ${res.status}: ${text}`)
      return NextResponse.json(
        { error: true, message: 'Tracerfy lookup failed' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[Tracerfy] Network error:', err)
    return NextResponse.json(
      { error: true, message: 'Unable to reach Tracerfy' },
      { status: 502 }
    )
  }
}
