'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { User } from '@/payload-types'
import { EMPLOYMENT_TYPES } from '@/auth/profileOptions'

type FormValues = {
  name: string
  email: string
  phone: string
  income: string
  employmentType: string
  acceptedTermsAndConditions: boolean
  acceptedPrivacyPolicy: boolean
}

const postJson = (url: string, body: unknown): Promise<{ data: any; status: number }> =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (res) => ({ status: res.status, data: await res.json().catch(() => ({})) }))

export const CompleteProfileForm = ({ user }: { user: User }) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      income: user.income != null ? String(user.income) : '',
      employmentType: user.employmentType || '',
      acceptedTermsAndConditions: false,
      acceptedPrivacyPolicy: false,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setError('')
    setSaving(true)
    const payload: Record<string, unknown> = { name: values.name.trim() }
    if (values.email.trim()) payload.email = values.email.trim()
    if (values.phone.trim()) payload.phone = values.phone.trim()
    if (values.income.trim()) payload.income = values.income.trim()
    if (values.employmentType) payload.employmentType = values.employmentType

    payload.acceptedTermsAndConditions = values.acceptedTermsAndConditions
    payload.acceptedPrivacyPolicy = values.acceptedPrivacyPolicy

    const { status, data } = await postJson('/api/users/complete-profile', payload)
    setSaving(false)

    if (status !== 200) {
      setError(data.error || 'Could not save your profile. Please try again.')
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <h1>Complete your profile</h1>
        <p>We need a few details before you get started.</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <label className="auth-label" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          className="auth-input"
          placeholder="Jane Doe"
          {...register('name', { required: true })}
        />

        <label className="auth-label" htmlFor="email">
          Email <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          id="email"
          className="auth-input"
          type="email"
          placeholder="you@example.com"
          {...register('email', { required: true })}
        />
        {errors.email && <span className="auth-field-error">Your email is required.</span>}

        <label className="auth-label" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          className="auth-input"
          type="tel"
          {...register('phone', { required: true })}
        />

        <label className="auth-label" htmlFor="income">
          Monthly income
        </label>
        <input
          id="income"
          className="auth-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="5000"
          {...register('income')}
        />

        <label className="auth-label" htmlFor="employmentType">
          Employment type
        </label>
        <select id="employmentType" className="auth-select" {...register('employmentType')}>
          <option value="">Select…</option>
          {EMPLOYMENT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div
          className="auth-checkbox-group"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}
        >
          <input
            id="acceptedTermsAndConditions"
            type="checkbox"
            {...register('acceptedTermsAndConditions', { required: true })}
          />
          <label htmlFor="acceptedTermsAndConditions" style={{ margin: 0, fontSize: '0.9rem' }}>
            I accept the Terms and Conditions <span style={{ color: 'red' }}>*</span>
          </label>
        </div>
        {errors.acceptedTermsAndConditions && (
          <span className="auth-field-error" style={{ display: 'block' }}>
            You must accept the terms.
          </span>
        )}

        <div
          className="auth-checkbox-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <input
            id="acceptedPrivacyPolicy"
            type="checkbox"
            {...register('acceptedPrivacyPolicy', { required: true })}
          />
          <label htmlFor="acceptedPrivacyPolicy" style={{ margin: 0, fontSize: '0.9rem' }}>
            I accept the Privacy Policy <span style={{ color: 'red' }}>*</span>
          </label>
        </div>
        {errors.acceptedPrivacyPolicy && (
          <span className="auth-field-error" style={{ display: 'block', marginBottom: '1rem' }}>
            You must accept the privacy policy.
          </span>
        )}

        <button type="submit" className="auth-button auth-button--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </div>
  )
}
