export type AuthenticationProvider = 'email' | 'phone' | 'google'

export type AccountStatus = 'active' | 'pending' | 'suspended'

export type IdentifierChannel = 'email' | 'phone'

export interface OtpRecord {
  identifier: string
  channel: IdentifierChannel
  codeHash: string
  salt: string
  expiresAt: number
  attempts: number
  maxAttempts: number
  lastSentAt: number
  resendAt: number
}

export interface OtpResult {
  channel: IdentifierChannel
  maskedIdentifier: string
  expiresInSeconds: number
  resendInSeconds: number
}