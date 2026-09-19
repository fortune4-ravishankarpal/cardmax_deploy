'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import './NotificationBell.scss'

interface NotificationItem {
  id: string
  title: string
  message: string
  status: string
  type: string
  createdAt: string
  actionUrl?: string
}

interface NotificationBellProps {
  userId: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const TYPE_ICONS: Record<string, string> = {
  statement: '📊',
  payment: '💳',
  subscription: '⭐',
  alert: '⚠️',
  goal: '🎯',
  application: '📋',
  onboarding: '🎉',
  system: '🔔',
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasNewNotif, setHasNewNotif] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const count = data.count ?? 0
      if (count > prevCountRef.current) {
        setHasNewNotif(true)
        setTimeout(() => setHasNewNotif(false), 3000)
      }
      prevCountRef.current = count
      setUnreadCount(count)
    } catch {
      // Silently fail — non-critical
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/me?limit=5', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.docs ?? [])
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Close on outside click / Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' })
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })))
      setUnreadCount(0)
    } catch {}
  }

  return (
    <div className="cm-notif-bell" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        type="button"
        className={`cm-notif-bell__trigger ${isOpen ? 'is-open' : ''} ${hasNewNotif ? 'is-new' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="cm-notif-bell__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="cm-notif-bell__badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="cm-notif-dropdown" role="dialog" aria-label="Notifications panel">
          {/* Header */}
          <div className="cm-notif-dropdown__header">
            <span className="cm-notif-dropdown__title">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="cm-notif-dropdown__mark-all"
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="cm-notif-dropdown__list">
            {loading ? (
              <div className="cm-notif-dropdown__empty">
                <span className="cm-notif-spinner" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="cm-notif-dropdown__empty">
                <div className="cm-notif-empty-icon">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </div>
                <p>You are all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`cm-notif-item ${notif.status !== 'read' ? 'is-unread' : ''}`}
                  onClick={() => {
                    if (notif.status !== 'read') markRead(notif.id)
                    if (notif.actionUrl) window.location.href = notif.actionUrl
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (notif.status !== 'read') markRead(notif.id)
                      if (notif.actionUrl) window.location.href = notif.actionUrl
                    }
                  }}
                >
                  <div className="cm-notif-item__icon">
                    {TYPE_ICONS[notif.type] || '🔔'}
                  </div>
                  <div className="cm-notif-item__body">
                    <p className="cm-notif-item__title">{notif.title}</p>
                    <p className="cm-notif-item__message">{notif.message}</p>
                    <span className="cm-notif-item__time">{timeAgo(notif.createdAt)}</span>
                  </div>
                  {notif.status !== 'read' && (
                    <span className="cm-notif-item__dot" aria-label="Unread" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="cm-notif-dropdown__footer">
            <Link
              href="/notifications"
              className="cm-notif-dropdown__view-all"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
