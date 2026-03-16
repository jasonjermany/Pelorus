import { extname } from 'node:path'

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .trim()
}

function getUnsupportedTypeError() {
  return createError({
    statusCode: 400,
    statusMessage: 'Unsupported file type',
    data: {
      message: 'Unsupported file type. Please upload PDF, DOCX, or TXT.',
    },
  })
}

export default defineEventHandler(async (event) => {
  try {
    const parts = await readMultipartFormData(event)
    const filePart = parts?.find((part) => part.filename && part.data)

    if (!filePart || !filePart.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing file',
        data: {
          message: 'Please upload a file to extract text.',
        },
      })
    }

    const buffer = Buffer.from(filePart.data)
    const extension = extname(filePart.filename).toLowerCase()

    if (extension === '.txt') {
      const text = normalizeText(buffer.toString('utf8'))
      if (!text) {
        throw createError({
          statusCode: 422,
          statusMessage: 'Empty file',
          data: {
            message: 'No readable text was found in the file.',
          },
        })
      }
      return { text }
    }

    if (extension === '.pdf') {
      const pdfParseModule = await import('pdf-parse')
      let extractedText = ''

      // pdf-parse v2 exposes a PDFParse class (no default function export).
      if ('PDFParse' in pdfParseModule && typeof pdfParseModule.PDFParse === 'function') {
        const parser = new pdfParseModule.PDFParse({ data: buffer })
        try {
          const result = await parser.getText()
          extractedText = result?.text || ''
        } finally {
          await Promise.resolve(parser.destroy())
        }
      } else {
        // Backward compatibility for legacy pdf-parse function-based export.
        const legacyParse = (pdfParseModule as { default?: (data: Buffer) => Promise<{ text?: string }> }).default
        if (typeof legacyParse !== 'function') {
          throw new Error('Unsupported pdf-parse module format.')
        }
        const result = await legacyParse(buffer)
        extractedText = result?.text || ''
      }

      const text = normalizeText(extractedText)

      if (!text) {
        throw createError({
          statusCode: 422,
          statusMessage: 'No readable PDF text',
          data: {
            message: 'Unable to extract text from this PDF. It may be scanned or image-based.',
          },
        })
      }

      return { text }
    }

    if (extension === '.docx') {
      const mammothModule = await import('mammoth')
      const result = await mammothModule.extractRawText({ buffer })
      const text = normalizeText(result?.value || '')

      if (!text) {
        throw createError({
          statusCode: 422,
          statusMessage: 'Empty DOCX',
          data: {
            message: 'No readable text was found in the file.',
          },
        })
      }

      return { text }
    }

    throw getUnsupportedTypeError()
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in (error as Record<string, unknown>)) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Text extraction failed',
      data: {
        message: error instanceof Error ? error.message : 'Failed to extract text from file.',
      },
    })
  }
})
