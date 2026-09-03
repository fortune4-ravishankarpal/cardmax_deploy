import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { hasRequiredConsent } from '@/auth/guard'
import { PolicyBanner } from './components/PolicyBanner'
import './styles.css'

export const metadata = {
  description: 'CardMax — Smart credit card rewards and optimization platform.',
  title: 'CardMax',
}

const EXEMPT_PATHS = [
  '/login',
  '/logout',
  '/consent-onboarding',
  '/terms-and-conditions',
  '/privacy-and-policy',
]

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const headers = await getHeaders()
  const pathname = headers.get('x-pathname') || ''

  // Only enforce consent guard on application routes (ignore internal APIs / admin)
  if (!pathname.startsWith('/api') && !pathname.startsWith('/admin')) {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers })

    if (user && user.collection === 'users') {
      const hasConsent = hasRequiredConsent(user as any)

      // If user lacks required consent and is attempting to access protected pages -> block and redirect
      if (!hasConsent && !EXEMPT_PATHS.includes(pathname)) {
        redirect('/consent-onboarding')
      }

      // If user already has required consent and tries to visit /consent-onboarding -> return to app
      if (hasConsent && pathname === '/consent-onboarding') {
        redirect('/')
      }
    }
  }

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        <PolicyBanner />
        <main>{children}</main>
      </body>
    </html>
  )
}
