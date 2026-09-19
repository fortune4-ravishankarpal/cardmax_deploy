/**
 * EmailService
 *
 * Factory that resolves the correct EmailProvider based on env config.
 * Always uses MockEmailProvider in simulation mode regardless of EMAIL_PROVIDER.
 */
import { env } from '../../lib/env'
import type { EmailMessage, EmailSendResult } from './provider'
import { MockEmailProvider, SmtpEmailProvider, ResendEmailProvider } from './provider'

function resolveProvider(isSimulationOverride?: boolean) {
  const isSimulation =
    typeof isSimulationOverride === 'boolean'
      ? isSimulationOverride
      : env.NOTIFICATION_MODE === 'simulation'

  if (isSimulation) {
    return new MockEmailProvider()
  }

  switch (env.EMAIL_PROVIDER) {
    case 'resend':
      return new ResendEmailProvider()
    case 'mock':
      return new MockEmailProvider()
    case 'smtp':
    default:
      return new SmtpEmailProvider()
  }
}

export class EmailService {
  static async send(message: EmailMessage): Promise<EmailSendResult> {
    const provider = resolveProvider(message.isSimulation)
    return provider.send(message)
  }
}
