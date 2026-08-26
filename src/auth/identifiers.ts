import type { IdentifierChannel } from '@/auth/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9][0-9\s()-]{5,19}$/

export const detectChannel = (identifier: string): IdentifierChannel => {
  const trimmed = identifier.trim()
  if (EMAIL_PATTERN.test(trimmed)) return 'email'
  if (PHONE_PATTERN.test(trimmed)) return 'phone'
  throw new Error('INVALID_IDENTIFIER')
}

export const acceptIdentifier = (identifier: string): string => {
  const trimmed = identifier.trim()
  if (!trimmed || trimmed.length > 120) throw new Error('INVALID_IDENTIFIER')
  if (!EMAIL_PATTERN.test(trimmed) && !PHONE_PATTERN.test(trimmed)) {
    throw new Error('INVALID_IDENTIFIER')
  }
  return trimmed
}

export const normalizePhone = (phone: string): string => {
  return phone.replace(/[^0-9+]/g, '')
}

export const syntheticEmailForPhone = (phone: string): string => {
  const digits = normalizePhone(phone).replace(/\D/g, '')
  return `user+${digits}@cardmax.local`
}

export const maskIdentifier = (channel: IdentifierChannel, identifier: string): string => {
  if (channel === 'email') {
    const [local, domain] = identifier.split('@')
    const m = local.length > 3 ? `${local.slice(0, 2)}***` : '***'
    return `${m}@${domain || 'domain'}`
  }

  const digits = normalizePhone(identifier)
  if (digits.length <= 4) return '****'
  const head = digits.length > 7 ? digits.slice(0, digits.length - 4) : ''
  const tail = digits.slice(-4)
  return `${head.replace(/./g, '*')}${tail}`
}

export const sanitizeForRateLimit = (identifier: string): string => {
  return identifier.trim().toLowerCase()
}