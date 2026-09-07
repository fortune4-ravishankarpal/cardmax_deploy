import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export const generateOtpCode = (length: number): string => {
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += random(0, 9).toString()
  }
  return code
}

const hash = (value: string): string => {
  return createHash('sha256').update(value).digest('hex')
}

export const otpHash = (code: string, salt: string): string => {
  return hash(`${salt}:${code}`)
}

export const safeEqual = (expectedHash: string, actualHash: string): boolean => {
  const a = Buffer.from(expectedHash, 'hex')
  const b = Buffer.from(actualHash, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export const randomHex = (bytes: number): string => {
  return randomBytes(bytes).toString('hex')
}

export const generateSecurePassword = (): string => {
  return `Aa1!${randomBytes(32).toString('hex')}`
}