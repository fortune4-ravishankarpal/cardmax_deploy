'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { sendOtpSchema, verifyOtpSchema } from '@/auth/validation/schemas'

type Channel = 'email' | 'phone'
type Step = 'choose' | 'identifier' | 'otp'

type IdentifierForm = { identifier: string }
type OtpForm = { code: string }

const postJson = (url: string, body: unknown): Promise<{ data: Record<string, any>; status: number }> =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (res) => ({ status: res.status, data: await res.json().catch(() => ({})) }))

export const LoginForm = () => {
  const [step, setStep] = useState<Step>('choose')
  const [channel, setChannel] = useState<Channel | null>(null)
  const [masked, setMasked] = useState('')
  const [expiresIn, setExpiresIn] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const identifierRef = useRef('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { register: registerIdentifier, handleSubmit: submitIdentifier } = useForm<IdentifierForm>()
  const {
    register: registerOtp,
    handleSubmit: submitOtp,
    setValue: setOtpValue,
  } = useForm<OtpForm>()

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const beginCountdown = useCallback(
    (resendInSeconds: number) => {
      stopTimer()
      setSecondsLeft(resendInSeconds)
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopTimer()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [stopTimer],
  )

  useEffect(() => stopTimer, [stopTimer])

  useEffect(() => {
    const queryError = new URLSearchParams(window.location.search).get('error')
    if (queryError) setError(queryError)
  }, [])

  const requestOtp = async (rawIdentifier: string, silent = false) => {
    if (!silent) setError('')
    setSending(true)

    const parsed = sendOtpSchema.safeParse({ identifier: rawIdentifier })
    if (!parsed.success) {
      setSending(false)
      setError('Enter a valid email address or phone number.')
      return
    }

    const { status, data } = await postJson('/api/users/send-otp', { identifier: parsed.data.identifier })
    setSending(false)

    if (status !== 200) {
      setError(data.error || 'Failed to send a code. Please try again.')
      return
    }

    identifierRef.current = parsed.data.identifier
    setChannel(data.channel)
    setMasked(data.maskedIdentifier)
    setExpiresIn(data.expiresInSeconds || 0)
    beginCountdown(data.resendInSeconds || 30)
    setStep('otp')
    setOtpValue('code', '')
  }

  const onSelectChannel = (next: Channel) => {
    setError('')
    setChannel(next)
    setStep('identifier')
  }

  const verifyCode = async ({ code }: OtpForm) => {
    setError('')
    const parsed = verifyOtpSchema.safeParse({ identifier: identifierRef.current, code })
    if (!parsed.success) {
      setError('Enter the code you received.')
      return
    }

    setVerifying(true)
    const { status, data } = await postJson('/api/users/verify-otp', {
      identifier: parsed.data.identifier,
      code: parsed.data.code,
    })
    setVerifying(false)

    if (status !== 200) {
      setError(data.error || 'The code could not be verified. Please try again.')
      return
    }

    window.location.href = data.profileComplete ? '/' : '/complete-profile'
  }

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <h1>CardMax</h1>
        <p>Sign in to your account</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {step === 'choose' && (
        <>
          <a className="auth-button auth-button--google" href="/api/users/google/login">
            <span className="auth-google-icon" aria-hidden="true">
              G
            </span>
            Continue with Google
          </a>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button type="button" className="auth-button" onClick={() => onSelectChannel('email')}>
            Continue with Email
          </button>
          <button type="button" className="auth-button" onClick={() => onSelectChannel('phone')}>
            Continue with Phone
          </button>
        </>
      )}

      {step === 'identifier' && channel && (
        <form className="auth-form" onSubmit={submitIdentifier(({ identifier }) => requestOtp(identifier))}>
          <label className="auth-label" htmlFor="identifier">
            {channel === 'email' ? 'Email address' : 'Phone number'}
          </label>
          <input
            id="identifier"
            className="auth-input"
            type={channel === 'email' ? 'email' : 'tel'}
            placeholder={channel === 'email' ? 'you@example.com' : '+1 555 000 0000'}
            autoComplete={channel === 'email' ? 'email' : 'tel'}
            inputMode={channel === 'email' ? 'email' : 'tel'}
            {...registerIdentifier('identifier')}
          />

          <button type="submit" className="auth-button auth-button--primary" disabled={sending}>
            {sending ? 'Sending code…' : 'Send code'}
          </button>
          <button type="button" className="auth-button--link" onClick={() => setStep('choose')}>
            Back
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form className="auth-form" onSubmit={submitOtp(verifyCode)}>
          <p className="auth-copy">
            Enter the {expiresIn > 0 ? `code ` : 'code '}sent to <strong>{masked}</strong>.
          </p>
          <label className="auth-label" htmlFor="code">
            Verification code
          </label>
          <input
            id="code"
            className="auth-input auth-input--otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="······"
            maxLength={8}
            {...registerOtp('code')}
          />

          <button type="submit" className="auth-button auth-button--primary" disabled={verifying}>
            {verifying ? 'Verifying…' : 'Verify and continue'}
          </button>

          <div className="auth-resend">
            {secondsLeft > 0 ? (
              <span>Resend code in {secondsLeft}s</span>
            ) : (
              <button
                type="button"
                className="auth-button--link"
                disabled={sending}
                onClick={() => requestOtp(identifierRef.current, true)}
              >
                {sending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          <button type="button" className="auth-button--link" onClick={() => setStep('identifier')}>
            Change email or phone
          </button>
        </form>
      )}
    </div>
  )
}