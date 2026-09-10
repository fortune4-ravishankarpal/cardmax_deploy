import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { hasRequiredConsent } from '@/auth/guard'
import { EntitlementsService } from '@/subscriptions/entitlements'
import { PolicyBanner } from './components/PolicyBanner'
import { Navbar, type NavbarUser } from './components/Navbar'
import { Footer } from './components/Footer'
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

const AUTH_ONBOARDING_PATHS = [
  '/login',
  '/logout',
  '/consent-onboarding',
  '/complete-profile',
]

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const headers = await getHeaders()
  const pathname = headers.get('x-pathname') || ''

  let currentUser: NavbarUser | null = null

  // Only enforce consent guard on application routes (ignore internal APIs / admin)
  if (!pathname.startsWith('/api') && !pathname.startsWith('/admin')) {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers })

    if (user && user.collection === 'users') {
      const isPro = await EntitlementsService.hasMaxPro(String(user.id))
      currentUser = {
        id: String(user.id),
        email: user.email,
        name: (user as any).name || (user as any).firstName || null,
        isPro,
      }

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

  const isAuthOrOnboarding = AUTH_ONBOARDING_PATHS.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="cm-app-body">
        <PolicyBanner />
        {!isAuthOrOnboarding && <Navbar initialUser={currentUser} />}
        <main className="cm-app-main">{children}</main>
        {!isAuthOrOnboarding && <Footer />}
      </body>
    </html>
  )
}
