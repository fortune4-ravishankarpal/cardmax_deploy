'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import './notifications.scss'

interface NotificationItem {
  id: string
  title: string
  message: string
  status: string
  type: string
  channel: string
  createdAt: string
  actionUrl?: string
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

const TYPE_LABELS: Record<string, string> = {
  statement: 'Statement',
  payment: 'Payment',
  subscription: 'Subscription',
  alert: 'Alert',
  goal: 'Goal',
  application: 'Application',
  onboarding: 'Onboarding',
  system: 'System',
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'alert', label: 'Alerts' },
  { id: 'statement', label: 'Statements' },
  { id: 'application', label: 'Applications' },
  { id: 'system', label: 'System' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async (tab: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20', page: String(p) })
      if (tab === 'unread') params.set('unread', 'true')
      else if (tab !== 'all') params.set('type', tab)

      const res = await fetch(`/api/notifications/me?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setNotifications(data.docs ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.count ?? 0)
    } catch {}
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    setPage(1)
    fetchNotifications(activeTab, 1)
  }, [activeTab, fetchNotifications])

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {}
  }

  const deleteNotif = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE', credentials: 'include' })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
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
    <div className="cm-notifications-page">
      <div className="cm-notifications-container">
        {/* Page header */}
        <div className="cm-notifications-header">
          <div className="cm-notifications-header__left">
            <Link href="/" className="cm-notifications-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </Link>
            <div>
              <h1 className="cm-notifications-title">
                Notifications
                {unreadCount > 0 && (
                  <span className="cm-notifications-count">{unreadCount} unread</span>
                )}
              </h1>
              <p className="cm-notifications-subtitle">
                All your CardMax alerts and updates in one place.
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              id="mark-all-read-btn"
              className="cm-notifications-mark-all"
              onClick={markAllRead}
            >
              ✓ Mark all as read
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="cm-notifications-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`notif-tab-${tab.id}`}
              className={`cm-notifications-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="cm-notifications-list">
          {loading ? (
            <div className="cm-notifications-loading">
              <div className="cm-notifications-spinner" />
              <p>Loading notifications…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="cm-notifications-empty">
              <div className="cm-notifications-empty__icon">🔔</div>
              <h2>Nothing here yet</h2>
              <p>
                {activeTab === 'unread'
                  ? 'All caught up! No unread notifications.'
                  : 'No notifications in this category yet.'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`cm-notif-row ${notif.status !== 'read' ? 'is-unread' : ''}`}
              >
                <div className="cm-notif-row__icon">
                  {TYPE_ICONS[notif.type] || '🔔'}
                </div>
                <div className="cm-notif-row__body">
                  <div className="cm-notif-row__header">
                    <span className="cm-notif-row__title">{notif.title}</span>
                    <span className="cm-notif-row__badge">{TYPE_LABELS[notif.type] || notif.type}</span>
                  </div>
                  <p className="cm-notif-row__message">{notif.message}</p>
                  <span className="cm-notif-row__time">{timeAgo(notif.createdAt)}</span>
                </div>
                <div className="cm-notif-row__actions">
                  {notif.status !== 'read' && (
                    <button
                      type="button"
                      className="cm-notif-row__action cm-notif-row__action--read"
                      onClick={() => markRead(notif.id)}
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    className="cm-notif-row__action cm-notif-row__action--delete"
                    onClick={() => deleteNotif(notif.id)}
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="cm-notifications-pagination">
            <button
              type="button"
              className="cm-notif-page-btn"
              onClick={() => { setPage(page - 1); fetchNotifications(activeTab, page - 1) }}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <span className="cm-notif-page-info">Page {page} of {totalPages}</span>
            <button
              type="button"
              className="cm-notif-page-btn"
              onClick={() => { setPage(page + 1); fetchNotifications(activeTab, page + 1) }}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
