// @vitest-environment node
import { describe, expect, it, beforeEach } from 'vitest'

import { verifyEncryption, encryptToken, decryptToken } from '@/auth/gmail/encryption'
import { matchIssuer, getIssuerNames } from '@/auth/gmail/issuers'
import { buildGmailQuery, extractPdfAttachments, type GmailMessageFull } from '@/auth/gmail/client'
import { saveGmailTokens, loadGmailTokens, getGmailConnectionStatus } from '@/auth/gmail/tokens'

describe('gmail token encryption', () => {
  it('round-trips an encrypted token', () => {
    expect(verifyEncryption('ya29.refresh-token-value')).toBe(true)
  })

  it('produces unique ciphertexts for the same plaintext (random IV)', () => {
    const a = encryptToken('secret-token')
    const b = encryptToken('secret-token')
    expect(a.iv).not.toBe(b.iv)
    expect(a.encrypted).not.toBe(b.encrypted)
  })

  it('decrypts to the original value', () => {
    const encrypted = encryptToken('my-refresh-token')
    expect(decryptToken(encrypted)).toBe('my-refresh-token')
  })
})

describe('issuer pattern matching', () => {
  it('returns a list of configured issuers', () => {
    const names = getIssuerNames()
    expect(names.length).toBeGreaterThan(10)
    expect(names).toContain('HDFC Bank')
  })

  it('matches HDFC statement emails by sender and subject', () => {
    const match = matchIssuer(
      'noreply@hdfcbank.com',
      'Your HDFC Bank Credit Card E-Statement is ready',
    )
    expect(match).not.toBeNull()
    expect(match?.name).toBe('HDFC Bank')
  })

  it('does not match when the sender is unknown', () => {
    const match = matchIssuer('random@example.org', 'Your statement is ready')
    expect(match).toBeNull()
  })

  it('matches case-insensitively', () => {
    const match = matchIssuer('Noreply@SBIcard.com', 'Monthly Statement from SBI Card')
    expect(match).not.toBeNull()
    expect(match?.name).toBe('SBI Card')
  })
})

describe('gmail search query builder', () => {
  it('builds a query from sender and subject patterns', () => {
    const q = buildGmailQuery(['hdfcbank.com', 'noreply@hdfcbank.com'], ['Statement', 'e-statement'])
    expect(q).toContain('from:hdfcbank.com')
    expect(q).toContain('from:noreply@hdfcbank.com')
    expect(q).toContain('"Statement"')
    expect(q).toContain('has:attachment')
    expect(q).toContain('filename:pdf')
  })
})

describe('gmail PDF attachment extraction', () => {
  const buildMessage = (overrides: Partial<GmailMessageFull> = {}): GmailMessageFull => ({
    id: 'msg-1',
    threadId: 'thread-1',
    payload: {
      headers: [{ name: 'From', value: 'noreply@hdfcbank.com' }],
    },
    ...overrides,
  })

  it('extracts a PDF from nested multipart parts', () => {
    const message = buildMessage({
      payload: {
        headers: [{ name: 'From', value: 'noreply@hdfcbank.com' }],
        parts: [
          {
            mimeType: 'multipart/mixed',
            parts: [
              {
                filename: 'HDFC_Statement.pdf',
                mimeType: 'application/pdf',
                body: { attachmentId: 'ATT-1', size: 1024, data: 'base64url-data' },
              },
            ],
          },
        ],
      },
    })
    const pdfs = extractPdfAttachments(message)
    expect(pdfs).toHaveLength(1)
    expect(pdfs[0].filename).toBe('HDFC_Statement.pdf')
    expect(pdfs[0].inlineData).toBe('base64url-data')
  })

  it('skips non-PDF attachments', () => {
    const message = buildMessage({
      payload: {
        headers: [],
        parts: [{ filename: 'notes.txt', mimeType: 'text/plain', body: { data: 'hello' } }],
      },
    })
    const pdfs = extractPdfAttachments(message)
    expect(pdfs).toHaveLength(0)
  })
})

describe('gmail tokens service', () => {
  let store: any[]
  const userId = 42

  const payloadStub = {
    find: async (args: any) => {
      const { where } = args
      let docs = store.filter((d) => d.collection === args.collection)
      if (where && where.and) {
        for (const cond of where.and) {
          const key = Object.keys(cond)[0]
          const op = Object.keys(cond[key])[0]
          const val = cond[key][op]
          if (op === 'equals') docs = docs.filter((d) => d[key] === val)
        }
      }
      return { docs: docs.slice(0, args.limit || 1) }
    },
    create: async (args: any) => {
      const doc = { id: Date.now().toString(), collection: args.collection, ...args.data }
      store.push(doc)
      return doc
    },
    update: async (args: any) => {
      const idx = store.findIndex(
        (d) => d.collection === args.collection && String(d.id) === String(args.id),
      )
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...args.data }
        return store[idx]
      }
      return null
    },
    delete: async (args: any) => {
      store = store.filter(
        (d) => !(d.collection === args.collection && String(d.id) === String(args.id)),
      )
      return { id: args.id }
    },
  } as any

  beforeEach(() => {
    store = []
  })

  it('saves and reloads an encrypted refresh token for a user', async () => {
    await saveGmailTokens(
      payloadStub,
      userId,
      {
        accessToken: 'access',
        refreshToken: 'super-secret-refresh-token',
        expiresAt: Date.now() + 3600 * 1000,
        scope: 'gmail.readonly',
        tokenType: 'Bearer',
      },
      'user@gmail.com',
    )

    // The stored document must not contain the plaintext refresh token
    expect(JSON.stringify(store)).not.toContain('super-secret-refresh-token')

    const loaded = await loadGmailTokens(payloadStub, userId)
    expect(loaded.refreshToken).toBe('super-secret-refresh-token')
    expect(loaded.gmailAddress).toBe('user@gmail.com')

    // Status is safe (no tokens exposed)
    const status = await getGmailConnectionStatus(payloadStub, userId)
    expect(status.connected).toBe(true)
    expect(status.gmailAddress).toBe('user@gmail.com')
    expect(JSON.stringify(status)).not.toContain('super-secret-refresh-token')
  })

  it('returns disconnected when no connection exists', async () => {
    const status = await getGmailConnectionStatus(payloadStub, 999)
    expect(status.connected).toBe(false)
  })
})
