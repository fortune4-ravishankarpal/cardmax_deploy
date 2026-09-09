import type { ParseTransaction } from '@/auth/gmail/types'
import type { GenericCreditCardStatement } from '../types'

/** Helper to parse a comma-formatted numeric string into a float */
function parseAmount(val: string | undefined): number | undefined {
  if (!val) return undefined
  const cleaned = val.replace(/[^\d.-]/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

/**
 * Generic best-effort regex-based credit card statement parser.
 * Extracts standard financial fields without requiring bank-specific knowledge.
 */
export class GenericStatementParser {
  public parse(pdfText: string, detectedIssuer?: string | null): GenericCreditCardStatement {
    const text = pdfText || ''

    return {
      issuer: detectedIssuer || undefined,
      cardLast4: this.extractCardLast4(text),
      statementDate: this.extractDate(text, [
        /(?:statement\s+date|bill\s+date|billing\s+date|invoice\s+date)[\s:]*([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.][1-2][0-9]{3})/i,
        /(?:statement\s+date|bill\s+date|billing\s+date)[\s:]*([0-3]?[0-9][\s\-\.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\.][1-2][0-9]{3})/i,
      ]),
      paymentDueDate: this.extractDate(text, [
        /(?:payment\s+due\s+date|due\s+date|pay\s+by)[\s:]*([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.][1-2][0-9]{3})/i,
        /(?:payment\s+due\s+date|due\s+date|pay\s+by)[\s:]*([0-3]?[0-9][\s\-\.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\.][1-2][0-9]{3})/i,
      ]),
      statementPeriodStart: this.extractPeriod(text)?.start,
      statementPeriodEnd: this.extractPeriod(text)?.end,
      totalAmountDue: parseAmount(
        this.extractMatch(text, [
          /(?:total\s+amount\s+due|total\s+dues?|current\s+dues?|total\s+outstanding)[\s:]*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
          /(?:amount\s+payable)[\s:]*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
        ]),
      ),
      minimumAmountDue: parseAmount(
        this.extractMatch(text, [
          /(?:minimum\s+amount\s+due|minimum\s+dues?|min\s+amount\s+due|min\s+dues?)[\s:]*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
        ]),
      ),
      previousBalance: parseAmount(
        this.extractMatch(text, [
          /(?:previous\s+balance|opening\s+balance)[\s:]*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
        ]),
      ),
      transactions: this.extractTransactions(text),
    }
  }

  private extractCardLast4(text: string): string | undefined {
    // Patterns for masked card numbers: "XXXX XXXX XXXX 1234", "**** **** **** 1234", "Card ending in 1234"
    const patterns = [
      /(?:card\s*(?:no|number)?|ending\s+in|account\s+no)[\s:]*(?:[xX*]{4}[\s-]?){2,3}(\d{4})/i,
      /(?:[xX*]{4}[\s-]?){2,3}(\d{4})\b/,
      /(?:card\s+ending\s+in|ending\s+in)\s*(\d{4})/i,
      /(?:account\s+number|card\s+number)[\s:]*[*xX]+(\d{4})/i,
    ]

    for (const pat of patterns) {
      const match = text.match(pat)
      if (match && match[1]) {
        return match[1]
      }
    }
    return undefined
  }

  private extractMatch(text: string, regexes: RegExp[]): string | undefined {
    for (const reg of regexes) {
      const m = text.match(reg)
      if (m && m[1]) return m[1].trim()
    }
    return undefined
  }

  private extractDate(text: string, regexes: RegExp[]): string | undefined {
    return this.extractMatch(text, regexes)
  }

  private extractPeriod(text: string): { start?: string; end?: string } | undefined {
    const periodRegexes = [
      /(?:statement\s+period|billing\s+period)[\s:]*([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.][1-2][0-9]{3})\s*(?:to|-)\s*([0-3]?[0-9][\/\-\.][0-1]?[0-9][\/\-\.][1-2][0-9]{3})/i,
      /(?:statement\s+period|billing\s+period)[\s:]*([0-3]?[0-9][\s\-\.][a-z]+[\s\-\.][1-2][0-9]{3})\s*(?:to|-)\s*([0-3]?[0-9][\s\-\.][a-z]+[\s\-\.][1-2][0-9]{3})/i,
    ]

    for (const reg of periodRegexes) {
      const match = text.match(reg)
      if (match && match[1] && match[2]) {
        return { start: match[1].trim(), end: match[2].trim() }
      }
    }
    return undefined
  }

  private extractTransactions(text: string): ParseTransaction[] {
    const transactions: ParseTransaction[] = []
    const lines = text.split(/\r?\n/)

    // Match lines starting with a date (e.g., "12/05/2026 Amazon India 1,499.00" or "05-May-2026 Uber Rides 450.00 Dr")
    const txRegex = /^([0-3]?[0-9][\/\-][0-1]?[0-9][\/\-][1-2][0-9]{3}|[0-3]?[0-9][\s\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-][1-2][0-9]{3})\s+(.+?)\s+([0-9,]+(?:\.[0-9]{2})?)\s*(?:Dr|Cr)?$/i

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      const match = line.match(txRegex)
      if (match) {
        const date = match[1]
        const description = match[2].trim()
        const amount = parseAmount(match[3])
        if (amount && !isNaN(amount)) {
          transactions.push({
            date,
            description,
            amount,
          })
        }
      }
    }

    return transactions
  }
}

export const genericStatementParser = new GenericStatementParser()
