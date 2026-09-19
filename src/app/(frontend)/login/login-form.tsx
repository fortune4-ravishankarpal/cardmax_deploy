'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { sendOtpSchema, verifyOtpSchema } from '@/auth/validation/schemas'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './login.scss'

type Channel = 'email' | 'phone'
type Step = 'choose' | 'identifier' | 'otp'

type IdentifierForm = { identifier: string }
type OtpForm = { code: string }

const postJson = (
  url: string,
  body: unknown,
): Promise<{ data: Record<string, unknown>; status: number }> =>
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
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('error') || ''
  })

  const router = useRouter()

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

  const requestOtp = async (rawIdentifier: string, silent = false) => {
    if (!silent) setError('')
    setSending(true)

    const parsed = sendOtpSchema.safeParse({ identifier: rawIdentifier })
    if (!parsed.success) {
      setSending(false)
      setError('Enter a valid email address or phone number.')
      return
    }

    const { status, data } = await postJson('/api/users/send-otp', {
      identifier: parsed.data.identifier,
    })
    setSending(false)

    if (status !== 200) {
      setError((data.error as string) || 'Failed to send a code. Please try again.')
      return
    }

    setIdentifier(parsed.data.identifier)
    setChannel(data.channel as Channel)
    setMasked((data.maskedIdentifier as string) || '')
    setExpiresIn((data.expiresInSeconds as number) || 0)
    beginCountdown((data.resendInSeconds as number) || 30)
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
    const parsed = verifyOtpSchema.safeParse({ identifier, code })
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
      setError((data.error as string) || 'The code could not be verified. Please try again.')
      return
    }

    if (data.consentRequired) {
      window.location.assign('/consent-onboarding')
    } else {
      window.location.assign(data.profileComplete ? '/' : '/complete-profile')
    }
  }

  const handleIdentifierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    void submitIdentifier(({ identifier: id }) => {
      void requestOtp(id)
    })(e)
  }

  return (
    <div className="cm-login-card">
      {/* LEFT SIDE: Navy/Slate Branding Panel */}
      <div className="cm-login-brand-panel">
        <div className="cm-login-brand-top">
          <Link href="/" className="cm-login-logo" aria-label="CardMax Home">
            <div className="cm-login-logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="14" x="2" y="5" rx="3" />
                <line x1="2" x2="22" y1="10" y2="10" />
                <line x1="6" x2="10" y1="15" y2="15" />
              </svg>
            </div>
            <span className="cm-login-logo-text">CardMax</span>
          </Link>

          <div className="cm-login-badge-wrap">
            <span className="cm-login-badge">SIGN IN</span>
          </div>

          <div className="cm-login-hero-text">
            <h1>
              Smart cards.
              <br />
              Better rewards.
            </h1>
            <p>Track your cards, understand your rewards, and make every spend count.</p>
          </div>

          <div className="cm-login-features">
            <div className="cm-login-feature-card">
              <div className="cm-feature-num">01</div>
              <div className="cm-feature-content">
                <strong>Track cards and rewards</strong>
                <span>Keep your credit card value organized in one place.</span>
              </div>
            </div>

            <div className="cm-login-feature-card">
              <div className="cm-feature-num">02</div>
              <div className="cm-feature-content">
                <strong>Discover missed value</strong>
                <span>See where the right card could have earned more.</span>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="cm-login-brand-bottom">
          <div className="cm-login-signup-card">
            <span>New to CardMax?</span>
            <button
              type="button"
              className="cm-login-signup-link"
              onClick={() => {
                setError('')
                setStep('choose')
              }}
            >
              Create your account →
            </button>
          </div>
        </div> */}
      </div>

      {/* RIGHT SIDE: White/Light Login Panel */}
      <div className="cm-login-auth-panel">
        <div className="cm-login-auth-content">
          <div className="cm-login-auth-header">
            <span className="cm-login-auth-tag">SIGN IN</span>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your CardMax account.</p>
          </div>

          {error && (
            <div className="cm-login-error" role="alert">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {step === 'choose' && (
            <div className="cm-login-actions">
              <Link className="cm-login-btn cm-login-btn--outline" href="/api/users/google/login">
                <span className="cm-google-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                </span>
                <span>Continue with Google</span>
              </Link>

              <div className="cm-login-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="cm-login-btn cm-login-btn--outline"
                onClick={() => onSelectChannel('email')}
              >
                Continue with Email
              </button>

              <button
                type="button"
                className="cm-login-btn cm-login-btn--outline"
                onClick={() => onSelectChannel('phone')}
              >
                Continue with Phone
              </button>
            </div>
          )}

          {step === 'identifier' && channel && (
            <form className="cm-login-form" onSubmit={handleIdentifierSubmit}>
              <div className="cm-form-group">
                <label className="cm-form-label" htmlFor="identifier">
                  {channel === 'email' ? 'Email address' : 'Phone number'}
                </label>
                <input
                  id="identifier"
                  className="cm-form-input"
                  type={channel === 'email' ? 'email' : 'tel'}
                  placeholder={channel === 'email' ? 'you@example.com' : '+1 555 000 0000'}
                  autoComplete={channel === 'email' ? 'email' : 'tel'}
                  inputMode={channel === 'email' ? 'email' : 'tel'}
                  {...registerIdentifier('identifier')}
                />
              </div>

              <button
                type="submit"
                className="cm-login-btn cm-login-btn--primary"
                disabled={sending}
              >
                {sending ? 'Sending code…' : 'Send code'}
              </button>
              <button
                type="button"
                className="cm-login-btn--link"
                onClick={() => setStep('choose')}
              >
                Back
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form className="cm-login-form" onSubmit={submitOtp(verifyCode)}>
              <p className="cm-form-copy">
                Enter the {expiresIn > 0 ? `code ` : 'code '}sent to <strong>{masked}</strong>.
              </p>
              <div className="cm-form-group">
                <label className="cm-form-label" htmlFor="code">
                  Verification code
                </label>
                <input
                  id="code"
                  className="cm-form-input cm-form-input--otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="······"
                  maxLength={8}
                  {...registerOtp('code')}
                />
              </div>

              <button
                type="submit"
                className="cm-login-btn cm-login-btn--primary"
                disabled={verifying}
              >
                {verifying ? 'Verifying…' : 'Verify and continue'}
              </button>

              <div className="cm-resend-area">
                {secondsLeft > 0 ? (
                  <span>Resend code in {secondsLeft}s</span>
                ) : (
                  <button
                    type="button"
                    className="cm-resend-btn"
                    disabled={sending}
                    onClick={() => requestOtp(identifier, true)}
                  >
                    {sending ? 'Sending…' : 'Resend code'}
                  </button>
                )}
              </div>

              <button
                type="button"
                className="cm-login-btn--link"
                onClick={() => setStep('identifier')}
              >
                Change email or phone
              </button>
            </form>
          )}
        </div>

        <div className="cm-login-auth-footer">
          <div className="cm-security-note">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Secure sign-in • Your information stays protected</span>
          </div>
          <p className="cm-legal-note">
            By continuing, you agree to CardMax's{' '}
            <Link href="/terms-and-conditions">terms</Link> and{' '}
            <Link href="/privacy-and-policy">privacy policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
