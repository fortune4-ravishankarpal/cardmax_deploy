'use client'

import { useState } from 'react'

export const LogoutButton = () => {
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = async () => {
    setLoggingOut(true)
    setError('')

    try {
      const res = await fetch('/api/users/logout', { method: 'POST' })
      if (!res.ok) {
        setError('Could not log out. Please try again.')
        setLoggingOut(false)
        return
      }
      window.location.href = '/login'
    } catch {
      setError('Network error. Please try again.')
      setLoggingOut(false)
    }
  }

  return (
    <>
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}
      <button
        type="button"
        className="auth-button auth-button--primary"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? 'Logging out…' : 'Log out'}
      </button>
      <a className="auth-button auth-button--link" href="/">
        Cancel
      </a>
    </>
  )
}