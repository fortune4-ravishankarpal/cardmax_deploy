import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ProfileView, UserProfileData } from './profile-view'
import { decryptPan, maskPan } from '@/auth/services/panCrypto'

export const metadata = {
  title: 'My Profile — CardMax',
  description: 'View and manage your CardMax user profile, personal and financial details, and connected services.',
}

export default async function ProfilePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users') {
    redirect('/login')
  }

  // Fetch full user record from database
  const fullUser = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 0,
    overrideAccess: true,
  })

  if (!fullUser) {
    redirect('/login')
  }

  // Quick stats: Cards in wallet
  const cardsResult = await payload.find({
    collection: 'user-cards',
    where: {
      user: { equals: user.id },
    },
    limit: 100,
    overrideAccess: true,
  })

  // Quick stats: Subscriptions
  const subscriptionsResult = await payload.find({
    collection: 'subscriptions',
    where: {
      user: { equals: user.id },
    },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })

  const activeSubscription = subscriptionsResult.docs[0] || null

  let panMasked: string | null = null
  let hasPan = false
  if (fullUser.pan && typeof fullUser.pan === 'object' && (fullUser.pan as any).ciphertext) {
    try {
      const dec = decryptPan(fullUser.pan as any)
      panMasked = maskPan(dec)
      hasPan = true
    } catch {
      panMasked = 'XXXXXX****'
      hasPan = true
    }
  }

  const profileData: UserProfileData = {
    id: fullUser.id,
    name: fullUser.name || '',
    email: fullUser.email || '',
    phone: fullUser.phone || '',
    income: fullUser.income != null ? fullUser.income : null,
    employmentType: fullUser.employmentType || null,
    pan: panMasked,
    hasPan,
    authenticationProvider: fullUser.authenticationProvider || 'email',
    profileCompleted: Boolean(fullUser.profileCompleted),
    accountStatus: fullUser.accountStatus || 'active',
    createdAt: fullUser.createdAt,
    marketingConsent: Boolean(fullUser.marketingConsent),
    stats: {
      activeCardsCount: cardsResult.docs.filter((c: any) => c.status === 'active').length,
      totalCardsCount: cardsResult.totalDocs || 0,
      subscriptionStatus: activeSubscription ? (activeSubscription as any).status : 'free',
    },
  }

  return <ProfileView initialUser={profileData} />
}
