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
        <input id="name" className="auth-input" placeholder="Jane Doe" {...register('name', { required: true })} />
        {errors.name && <span className="auth-field-error">Your name is required.</span>}

        <label className="auth-label" htmlFor="email">
          Email
        </label>
        <input id="email" className="auth-input" type="email" placeholder="you@example.com" {...register('email')} />

        <label className="auth-label" htmlFor="phone">
          Phone
        </label>
        <input id="phone" className="auth-input" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />

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

        <button type="submit" className="auth-button auth-button--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </div>
  )
}