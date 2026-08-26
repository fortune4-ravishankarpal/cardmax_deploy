import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { isProfileComplete } from '@/auth/services/profileService'
import { CompleteProfileForm } from './complete-profile-form'

export default async function CompleteProfilePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users') {
    redirect('/login')
  }

  if (isProfileComplete(user)) {
    redirect('/')
  }

  return (
    <main className="auth-page">
      <CompleteProfileForm user={user} />
    </main>
  )
}