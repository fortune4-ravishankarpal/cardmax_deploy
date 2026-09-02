'use client'

import React, { useState } from 'react'
import './styles.scss'

export default function ConsentPage() {
  const [consents, setConsents] = useState({
    financial_data: false,
    marketing: false,
    third_party_sharing: false
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleToggle = (key: keyof typeof consents) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      // Assuming a generic update endpoint for the user's consent preferences
      // In reality, this would hit the specific consent endpoints you built
      const res = await fetch('/api/users/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consents })
      })

      if (!res.ok) throw new Error('Failed to save preferences')
      
      setMessage('Preferences saved successfully')
    } catch (err: any) {
      setMessage(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="consent-page">
      <h1>Privacy & Consent Settings</h1>
      <p className="description">Manage how CardMax uses your data.</p>

      <div className="consent-list">
        <div className="consent-item">
          <div className="info">
            <h3>Financial Data Processing</h3>
            <p>Allow CardMax to process your credit card statements to provide insights and track targets. (Required for Pro features)</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={consents.financial_data}
              onChange={() => handleToggle('financial_data')}
            />
            <span className="slider round"></span>
          </label>
        </div>

        <div className="consent-item">
          <div className="info">
            <h3>Marketing Communications</h3>
            <p>Receive updates about new features, partner offers, and credit card news.</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={consents.marketing}
              onChange={() => handleToggle('marketing')}
            />
            <span className="slider round"></span>
          </label>
        </div>
        
        <div className="consent-item">
          <div className="info">
            <h3>Third-Party Sharing</h3>
            <p>Allow anonymized data sharing with banking partners to improve card offerings.</p>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={consents.third_party_sharing}
              onChange={() => handleToggle('third_party_sharing')}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <button 
        className="btn-save" 
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  )
}
