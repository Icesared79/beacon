import { NextRequest, NextResponse } from 'next/server'

const DEMO_USERS = [
  {
    email: 'beacon@consumercredit.com',
    password: 'ACCC2026',
    name: 'ACCC Demo',
    role: 'admin',
  },
]

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email?.toLowerCase() && u.password === password
  )

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const session = btoa(JSON.stringify({ email: user.email, name: user.name, role: user.role }))

  const res = NextResponse.json({ ok: true, name: user.name })
  res.cookies.set('beacon_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return res
}
