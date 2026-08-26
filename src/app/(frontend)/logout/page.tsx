import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { LogoutButton } from './logout-button'

export default async function LogoutPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Log out</h1>
          <p>You are signed in as {user.email}. Are you sure you want to log out?</p>
        </div>
        <LogoutButton />
      </div>
    </main>
  )
}