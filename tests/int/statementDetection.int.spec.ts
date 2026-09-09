// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { classifyStatement, STATEMENT_DETECTION_THRESHOLD } from '@/auth/gmail/statement/classifier/statementClassifier'
import { detectIssuer } from '@/auth/gmail/statement/classifier/issuerDetector'
import { genericStatementParser } from '@/auth/gmail/statement/parsers/genericStatementParser'
import { maskSensitive } from '@/auth/gmail/statement/statementLogger'
import type { StatementContext } from '@/auth/gmail/statement/types'

describe('Credit Card Statement Detection & Classification', () => {
  const createContext = (overrides: Partial<StatementContext> = {}): StatementContext => ({
    sender: 'cards@hdfcbank.com',
    subject: 'Your HDFC Bank Credit Card Statement',
    attachmentFilename: 'HDFC_Statement_May2026.pdf',
    messageId: 'msg-test-1',
    ...overrides,
  })

  // 1. Known HDFC Statement
  it('identifies and classifies a known HDFC statement', () => {
    const context = createContext({
      sender: 'statement@hdfcbank.com',
      subject: 'HDFC Bank Credit Card Statement for Account ending in 9876',
      attachmentFilename: 'e_statement.pdf',
    })
    const text = `
      HDFC BANK
      CREDIT CARD STATEMENT
      Card Number: XXXX-XXXX-XXXX-9876
      Statement Date: 15/05/2026
      Payment Due Date: 05/06/2026
      Total Amount Due: Rs. 14,850.50
      Minimum Amount Due: Rs. 750.00
      Previous Balance: Rs. 5,000.00
      Transaction Details:
      16/05/2026 Amazon Pay 1,299.00
      18/05/2026 Zomato Online 450.00
    `

    const classification = classifyStatement(text, context)
    expect(classification.isStatement).toBe(true)
    expect(classification.confidence).toBeGreaterThanOrEqual(0.8)

    const issuerResult = detectIssuer(text, context)
    expect(issuerResult.issuer).toBe('HDFC Bank')
    expect(issuerResult.confidence).toBeGreaterThanOrEqual(0.9)
  })

  // 2. Known SBI Statement
  it('identifies and classifies a known SBI Card statement', () => {
    const context = createContext({
      sender: 'noreply@sbicard.com',
      subject: 'Monthly Statement for your SBI Card',
      attachmentFilename: 'sbicard_statement.pdf',
    })
    const text = `
      SBI Card
      Credit Card Monthly Statement
      Card Number: ************4321
      Statement Date: 20-May-2026
      Payment Due Date: 10-Jun-2026
      Total Amount Due: Rs. 28,400.00
      Minimum Amount Due: Rs. 1,420.00
      Current Balance: 28,400.00
    `

    const classification = classifyStatement(text, context)
    expect(classification.isStatement).toBe(true)

    const issuerResult = detectIssuer(text, context)
    expect(issuerResult.issuer).toBe('SBI Card')
    expect(issuerResult.confidence).toBeGreaterThanOrEqual(0.9)
  })

  // 3. Known ICICI Statement
  it('identifies and classifies a known ICICI Bank statement', () => {
    const context = createContext({
      sender: 'creditcards@icicibank.com',
      subject: 'Your ICICI Bank Credit Card E-Statement is ready',
      attachmentFilename: 'statement_icici.pdf',
    })
    const text = `
      ICICI Bank
      Credit Card Statement
      Card Number: 4315-XXXX-XXXX-1122
      Statement Period: 01/04/2026 to 30/04/2026
      Statement Date: 01/05/2026
      Payment Due Date: 21/05/2026
      Total Amount Due: Rs. 45,900.00
      Minimum Amount Due: Rs. 2,500.00
    `

    const classification = classifyStatement(text, context)
    expect(classification.isStatement).toBe(true)

    const issuerResult = detectIssuer(text, context)
    expect(issuerResult.issuer).toBe('ICICI Bank')
  })

  // 4. Unknown Sender + Valid Credit-Card PDF (MUST NOT BE IGNORED)
  it('classifies statement from unknown sender with valid PDF and does NOT ignore it', () => {
    const context = createContext({
      sender: 'notifications@neofintech-partner.com',
      subject: 'Important account communication',
      attachmentFilename: 'account_doc.pdf',
    })
    const text = `
      CREDIT CARD STATEMENT
      Card Number: **** **** **** 7788
      Statement Date: 10/05/2026
      Payment Due Date: 30/05/2026
      Total Amount Due: Rs. 8,230.00
      Minimum Amount Due: Rs. 500.00
      Previous Balance: Rs. 0.00
      Transaction Details:
      12/05/2026 Coffee Roasters 350.00
      14/05/2026 Grocery Mart 1,880.00
    `

    const classification = classifyStatement(text, context)
    // Should pass despite unknown sender and generic subject/filename
    expect(classification.isStatement).toBe(true)
    expect(classification.confidence).toBeGreaterThanOrEqual(STATEMENT_DETECTION_THRESHOLD)

    const issuerResult = detectIssuer(text, context)
    // Issuer is unknown, but document is recognized as statement
    expect(issuerResult.issuer).toBeNull()

    const parsed = genericStatementParser.parse(text, issuerResult.issuer)
    expect(parsed.cardLast4).toBe('7788')
    expect(parsed.totalAmountDue).toBe(8230)
    expect(parsed.minimumAmountDue).toBe(500)
    expect(parsed.paymentDueDate).toBe('30/05/2026')
    expect(parsed.transactions.length).toBe(2)
  })

  // 5. Unknown Issuer + Generic Statement Parser
  it('falls back to generic parser when issuer is completely unknown', () => {
    const context = createContext({
      sender: 'service@unknownbank.com',
      subject: 'Monthly card statement',
      attachmentFilename: 'doc.pdf',
    })
    const text = `
      Global Platinum Card
      Credit Card Statement
      Card ending in 5544
      Statement Period: 01/01/2026 to 31/01/2026
      Payment Due Date: 18/02/2026
      Statement Date: 01/02/2026
      Total Amount Due: Rs. 12,500.00
      Minimum Amount Due: Rs. 650.00
    `

    const issuerResult = detectIssuer(text, context)
    expect(issuerResult.issuer).toBeNull()

    const parsed = genericStatementParser.parse(text, null)
    expect(parsed.issuer).toBeUndefined()
    expect(parsed.cardLast4).toBe('5544')
    expect(parsed.paymentDueDate).toBe('18/02/2026')
    expect(parsed.statementDate).toBe('01/02/2026')
    expect(parsed.statementPeriodStart).toBe('01/01/2026')
    expect(parsed.statementPeriodEnd).toBe('31/01/2026')
    expect(parsed.totalAmountDue).toBe(12500)
  })

  // 6. Non-Statement PDF (Tax Invoice -> IGNORED)
  it('rejects a normal non-statement PDF such as a tax invoice', () => {
    const context = createContext({
      sender: 'billing@ecommerce.com',
      subject: 'Your Order Invoice #48921',
      attachmentFilename: 'invoice.pdf',
    })
    const text = `
      TAX INVOICE
      Bill To: John Doe
      Shipping Address: 123 Main Street, Bangalore
      Order Summary:
      Item Description   Quantity   Unit Price   Total
      Wireless Mouse            1       899.00   899.00
      USB-C Cable               2       299.00   598.00
      Total: 1,497.00
      Thank you for your business!
    `

    const classification = classifyStatement(text, context)
    expect(classification.isStatement).toBe(false)
    expect(classification.confidence).toBeLessThan(STATEMENT_DETECTION_THRESHOLD)
  })

  // 7. Misleading Filename (Filename has "statement.pdf", but PDF is an invoice)
  it('does NOT classify as statement based on filename alone when content is an invoice', () => {
    const context = createContext({
      sender: 'accounting@vendorcorp.com',
      subject: 'Monthly statement and bill',
      attachmentFilename: 'statement.pdf',
    })
    const text = `
      TAX INVOICE / VENDOR BILL
      Bill To: Software Services Pvt Ltd
      Item Description   HSN Code   Quantity   Unit Price
      Cloud Hosting             1    15,000.00  15,000.00
      GST 18%: 2,700.00
      Total Payable: 17,700.00
    `

    const classification = classifyStatement(text, context)
    expect(classification.isStatement).toBe(false)
  })

  // 8. Statement with Missing Fields (Handled Gracefully)
  it('gracefully handles statements with missing fields without throwing errors', () => {
    const text = `
      Credit Card Statement
      Card Number: XXXX-XXXX-XXXX-9999
      Total Amount Due: Rs. 3,400.00
    `

    const parsed = genericStatementParser.parse(text, 'AnyBank')
    expect(parsed.cardLast4).toBe('9999')
    expect(parsed.totalAmountDue).toBe(3400)
    expect(parsed.paymentDueDate).toBeUndefined()
    expect(parsed.statementDate).toBeUndefined()
    expect(parsed.minimumAmountDue).toBeUndefined()
    expect(parsed.transactions).toEqual([])
  })

  // 9. Issuer Present Only inside PDF Content (Sender is generic/third-party)
  it('detects issuer from PDF content even when sender address is an external service', () => {
    const context = createContext({
      sender: 'noreply@thirdpartydispatch.com',
      subject: 'Your Monthly e-document',
      attachmentFilename: 'document_082026.pdf',
    })
    const text = `
      Axis Bank Limited
      Credit Card Statement
      Card ending in 3344
      Statement Date: 12/08/2026
      Payment Due Date: 01/09/2026
      Total Amount Due: Rs. 21,500.00
      Minimum Amount Due: Rs. 1,100.00
    `

    const classification = classifyStatement(text, context)
    expect(classification.isStatement).toBe(true)

    const issuerResult = detectIssuer(text, context)
    expect(issuerResult.issuer).toBe('Axis Bank')
    expect(issuerResult.matchedSignals.some((s) => s.includes('found in PDF content'))).toBe(true)
  })

  // 10. Sender does not match configured issuer, but PDF content matches known bank
  it('identifies YES Bank when sender is an internal employee email but PDF is YES Bank statement', () => {
    const context = createContext({
      sender: 'pratik.y@fortune4.in',
      subject: 'Fwd: Credit card statement',
      attachmentFilename: 'Yes_Bank_eStatement.pdf',
    })
    const text = `
      YES Bank Credit Card
      Statement Date: 05/06/2026
      Payment Due Date: 25/06/2026
      Credit Card Number: **** **** **** 8822
      Total Amount Due: Rs. 9,450.00
      Minimum Amount Due: Rs. 500.00
      Transaction Details:
      07/06/2026 Swiggy Food 650.00
    `

    const classification = classifyStatement(text, context)
    expect(classification.isStatement).toBe(true)

    const issuerResult = detectIssuer(text, context)
    expect(issuerResult.issuer).toBe('YES Bank')
  })

  // 11. Sensitive PII Masking
  it('masks card numbers and email addresses in logger utility', () => {
    const unmasked = 'Customer ravishankar.pal@fortune4.in card 4532112233445566'
    const masked = maskSensitive(unmasked)
    expect(masked).not.toContain('4532112233445566')
    expect(masked).toContain('************5566')
    expect(masked).not.toContain('ravishankar.pal@fortune4.in')
    expect(masked).toContain('r***l@fortune4.in')
  })

  // 12. PDF Text Extraction resilience
  it('gracefully handles empty and invalid PDF buffers', async () => {
    const { extractPdfText } = await import('@/auth/gmail/statement/extractors/pdfTextExtractor')
    const emptyResult = await extractPdfText(Buffer.from([]))
    expect(emptyResult.success).toBe(false)
    expect(emptyResult.text).toBe('')

    const corruptResult = await extractPdfText(Buffer.from('not a pdf at all'))
    expect(corruptResult.success).toBe(false)
    expect(corruptResult.text).toBe('')
  })

  // 13. End-to-end processStatementPdf pipeline
  it('processes statement through processStatementPdf orchestrator', async () => {
    const extractorModule = await import('@/auth/gmail/statement/extractors/pdfTextExtractor')
    const { processStatementPdf } = await import('@/auth/gmail/statement/statementProcessor')

    const mockText = `
      CREDIT CARD STATEMENT
      Statement Date: 12/05/2026
      Payment Due Date: 02/06/2026
      Total Amount Due: Rs. 5,400.00
      Minimum Amount Due: Rs. 500.00
      Card ending in 1234
    `

    const spy = vi.spyOn(extractorModule, 'extractPdfText').mockResolvedValue({
      text: mockText,
      pageCount: 1,
      success: true,
    })

    const dummyPdfBuffer = Buffer.from('dummy-pdf-content')

    const context = createContext({
      sender: 'statements@fintechbank.in',
      subject: 'Monthly Document',
      attachmentFilename: 'doc_55.pdf',
    })

    const result = await processStatementPdf(dummyPdfBuffer, context)
    expect(result.isStatement).toBe(true)
    expect(result.classification.confidence).toBeGreaterThanOrEqual(STATEMENT_DETECTION_THRESHOLD)
    expect(result.parsedData?.cardLast4).toBe('1234')
    expect(result.parsedData?.totalAmountDue).toBe(5400)
    expect(result.parsedData?.paymentDueDate).toBe('02/06/2026')

    spy.mockRestore()
  })
})

