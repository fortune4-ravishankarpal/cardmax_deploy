interface RateLimitResult {
  allowed: boolean
  retryAfterMs: number
}

const buckets = new Map<string, number[]>()

export const checkRateLimit = (
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult => {
  const now = Date.now()
  const timestamps = (buckets.get(key) || []).filter((t) => now - t < windowMs)

  if (timestamps.length >= max) {
    return { allowed: false, retryAfterMs: Math.max(0, windowMs - (now - timestamps[0])) }
  }

  timestamps.push(now)
  buckets.set(key, timestamps)
  return { allowed: true, retryAfterMs: 0 }
}

export const clearRateLimit = (key: string): void => {
  buckets.delete(key)
}