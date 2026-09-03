import { z } from 'zod'

export const sendOtpSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
})

export const verifyOtpSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  code: z.string().trim().regex(/^\d{4,8}$/, 'OTP must be 4-8 digits'),
  name: z.string().trim().min(1).max(120).optional(),
})

export const completeProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().min(6).max(20).optional().or(z.literal('')),
  income: z.union([z.number().min(0), z.string().trim().min(1).max(20)]).optional(),
  employmentType: z.string().trim().min(1).max(60).optional(),
  acceptedTermsAndConditions: z.boolean().optional(),
  acceptedPrivacyPolicy: z.boolean().optional(),
  /** Whether the user opted in to marketing/promotional emails. Default: false. */
  marketingConsent: z.boolean().optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  phone: z.string().trim().max(20).optional().nullable(),
  income: z.union([z.number().min(0), z.string().trim().max(20)]).optional().nullable(),
  employmentType: z.string().trim().max(60).optional().nullable(),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>