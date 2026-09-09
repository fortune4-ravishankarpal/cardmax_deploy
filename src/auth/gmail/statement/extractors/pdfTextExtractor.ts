import { createRequire } from 'node:module'
import { PDFParse as ESM_PDFParse } from 'pdf-parse'

const nodeRequire = createRequire(import.meta.url)

function getPDFParseClass(): typeof ESM_PDFParse {
  try {
    const mod = nodeRequire('pdf-parse')
    return mod.PDFParse || mod.default?.PDFParse || mod
  } catch {
    return ESM_PDFParse
  }
}

/**
 * Libraries like drizzle-kit add enumerable properties (such as 'random') to Array.prototype.
 * pdfjs-dist strictly checks `for (const key in [])` and throws an error if any enumerable
 * property exists. We make any custom properties non-enumerable before parsing.
 */
function sanitizeArrayPrototype(): void {
  for (const key in []) {
    try {
      Object.defineProperty(Array.prototype, key, {
        enumerable: false,
        configurable: true,
        writable: true,
      })
    } catch {
      try {
        delete (Array.prototype as any)[key]
      } catch {
        // Non-fatal
      }
    }
  }
}

export interface PdfTextExtractionResult {
  text: string
  pageCount: number
  success: boolean
  error?: string
}

/**
 * Extracts plain text from a PDF Buffer deterministically using PDFParse.
 * Catches parse errors (e.g., password protected or corrupt PDFs) gracefully.
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<PdfTextExtractionResult> {
  try {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: 'Empty PDF buffer provided',
      }
    }

    let extractedText = ''
    let totalPages = 1
    let parseError: string | undefined

    try {
      sanitizeArrayPrototype()
      const PDFParserClass = getPDFParseClass() || ESM_PDFParse
      const copy = new Uint8Array(pdfBuffer.byteLength)
      copy.set(pdfBuffer)
      const parser = new PDFParserClass({ data: copy })
      const result = await parser.getText()
      extractedText = result?.text || ''
      totalPages = result?.total || 1
      await parser.destroy()
    } catch (parseErr) {
      parseError = parseErr instanceof Error ? parseErr.message : String(parseErr)
      console.error('[pdfTextExtractor] PDFParse threw error:', parseErr)
    }

    // Fallback for uncompressed PDF text streams
    if (!extractedText.trim()) {
      const raw = pdfBuffer.toString('latin1')
      const matches = [...raw.matchAll(/\(([^\\)]*(?:\\.[^\\)]*)*)\)\s*(?:Tj|'|"|TJ)/g)]
      if (matches.length > 0) {
        extractedText = matches.map((m) => m[1].replace(/\\([()\\])/g, '$1')).join('\n')
      }
    }

    const success = Boolean(extractedText.trim())
    return {
      text: extractedText,
      pageCount: totalPages,
      success,
      error: success ? undefined : (parseError || (extractedText ? undefined : 'No readable text in PDF')),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `Failed to extract PDF text: ${message}`,
    }
  }
}

