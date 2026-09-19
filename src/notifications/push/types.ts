/** Push notification message (sanitized — no sensitive financial data) */
export interface PushMessage {
  title: string
  body: string
  /** Optional deep-link URL (no sensitive data) */
  actionUrl?: string
  /** Optional generic category for client-side routing */
  category?: string
}

export interface PushSendResult {
  success: boolean
  messageId?: string
  error?: string
  /** true if the token was invalidated and deactivated */
  tokenDeactivated?: boolean
}
