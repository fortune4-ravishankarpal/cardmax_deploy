import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import Link from 'next/link'

import config from '@/payload.config'
import { hasRequiredConsent } from '@/auth/guard'
import { ConsentOnboardingForm } from './consent-onboarding-form'
import './styles.scss'

export const metadata = {
  title: 'Welcome to CardMax — Required Terms & Privacy',
  description: 'Please review and accept our Terms of Service and Privacy Notice to continue.',
}

export default async function ConsentOnboardingPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users') {
    redirect('/login')
  }

  // If the user already has valid current consent, don't show the screen again
  if (hasRequiredConsent(user as any)) {
    redirect('/')
  }

  return (
    <div className="onboarding-page">
      <header className="onboarding-topbar">
        <span className="brand-logo">CardMax</span>
        <Link href="/logout" className="signout-link">
          Sign out
        </Link>
      </header>

      <main className="onboarding-main">
        <ConsentOnboardingForm />
      </main>
    </div>
  )
}
