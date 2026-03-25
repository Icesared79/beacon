import { redirect } from 'next/navigation'

export default function Home() {
  // Proxy handles auth checks — unauthenticated users on /dashboard
  // get redirected to /login. Default landing goes to dashboard.
  redirect('/dashboard')
}
