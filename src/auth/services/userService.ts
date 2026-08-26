import type { Payload } from 'payload'

import type { AuthenticationProvider, IdentifierChannel } from '@/auth/types'
import { randomHex } from '@/auth/code'
import { syntheticEmailForPhone } from '@/auth/identifiers'

type UserData = {
  email?: string
  phone?: string
  name?: string
  provider: AuthenticationProvider
  providerId?: string
  profileCompleted?: boolean
}

export const findUserByEmail = async (payload: Payload, email: string) => {
  const result = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  return result.docs[0] || null
}

export const findUserByPhone = async (payload: Payload, phone: string) => {
  const result = await payload.find({
    collection: 'users',
    where: { phone: { equals: phone } },
    limit: 1,
    depth: 0,
  })
  return result.docs[0] || null
}

export const createUser = async (payload: Payload, data: UserData) => {
  const email = data.email || syntheticEmailForPhone(data.phone || '')
  return payload.create({
    collection: 'users',
    data: {
      email,
      phone: data.phone,
      name: data.name || '',
      authenticationProvider: data.provider,
      authenticationProviderId: data.providerId || '',
      profileCompleted: data.profileCompleted ?? false,
      accountStatus: 'active',
      password: randomHex(32),
    },
    overrideAccess: true,
    depth: 0,
  })
}

export const findOrCreateByIdentifier = async (
  payload: Payload,
  input: {
    channel: IdentifierChannel
    identifier: string
    provider: AuthenticationProvider
    providerId?: string
    name?: string
  },
) => {
  if (input.channel === 'email') {
    const existing = await findUserByEmail(payload, input.identifier.toLowerCase())
    if (existing) return { user: existing, created: false }
    const user = await createUser(payload, {
      email: input.identifier.toLowerCase(),
      name: input.name,
      provider: input.provider,
      providerId: input.providerId,
    })
    return { user, created: true }
  }

  const existing = await findUserByPhone(payload, input.identifier)
  if (existing) return { user: existing, created: false }
  const user = await createUser(payload, {
    phone: input.identifier,
    name: input.name,
    provider: input.provider,
    providerId: input.providerId || input.identifier,
  })
  return { user, created: true }
}

export const findOrCreateByGoogleProfile = async (
  payload: Payload,
  profile: { email?: string; id: string; name?: string },
) => {
  const existingById = await payload.find({
    collection: 'users',
    where: { authenticationProviderId: { equals: profile.id } },
    limit: 1,
    depth: 0,
  })
  if (existingById.docs[0]) return { user: existingById.docs[0], created: false }

  if (profile.email) {
    const existingByEmail = await findUserByEmail(payload, profile.email.toLowerCase())
    if (existingByEmail) {
      const user = await payload.update({
        collection: 'users',
        id: existingByEmail.id,
        data: {
          authenticationProvider: 'google',
          authenticationProviderId: profile.id,
          name: existingByEmail.name || profile.name || '',
        },
        overrideAccess: true,
        depth: 0,
      })
      return { user, created: false }
    }
  }

  const user = await createUser(payload, {
    email: profile.email,
    name: profile.name,
    provider: 'google',
    providerId: profile.id,
  })
  return { user, created: true }
}