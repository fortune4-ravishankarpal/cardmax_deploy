/**
 * Errors thrown by the secure card vault (encryption, validation, authorization).
 *
 * Never include a PAN or any sensitive card value in `message` — these
 * messages may reach logs, error monitors, or API responses.
 */

export interface CardErrorOptions<Cause = unknown> {
  cause?: Cause
}

export class CardError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400, options?: CardErrorOptions) {
    super(message, options)
    this.name = 'CardError'
    this.code = code
    this.status = status
  }
}

/** Guard that keeps PAN and sensitive card values out of thrown errors. */
export const cardError = (code: string, message: string, status = 400): CardError =>
  new CardError(code, message, status)