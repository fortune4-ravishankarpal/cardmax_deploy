import { PDFParse } from 'pdf-parse'

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

    try {
      const copy = new Uint8Array(pdfBuffer.byteLength)
      copy.set(pdfBuffer)
      const parser = new PDFParse({ data: copy })
      const result = await parser.getText()
      extractedText = result?.text || ''
      totalPages = result?.total || 1
      await parser.destroy()
    } catch (parseErr) {
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

    return {
      text: extractedText,
      pageCount: totalPages,
      success: Boolean(extractedText.trim()),
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
