#!/usr/bin/env node
/**
 * One-off: extract text from a PDF the same way ai-analysis does.
 * Usage: node scripts/extract-pdf-text.mjs <path-to-pdf>
 * Use to verify what text we send to the AI (e.g. does Box 12 / Code D appear?).
 */
import { readFile } from 'fs/promises'

async function main() {
  const path = process.argv[2]
  if (!path) {
    console.error('Usage: node scripts/extract-pdf-text.mjs <path-to-pdf>')
    process.exit(1)
  }
  const buffer = await readFile(path)
  const text = await extractTextFromPdfBuffer(buffer)
  console.log('--- Extracted text (what we send to the AI) ---\n')
  console.log(text)
  console.log('\n--- End ---')
  const hasBox12 = /box\s*12|code\s*[A-Za-z]|12\s*[A-Za-z]\s*[\d,.]|\bD\b.*\d|deferral|401/i.test(text)
  console.log('\nContains Box 12 / Code / deferral-like terms:', hasBox12)
}

async function ensureDOMMatrix() {
  if (typeof globalThis.DOMMatrix !== 'undefined') return
  try {
    const dm = await import('dommatrix')
    globalThis.DOMMatrix = dm.default ?? dm
  } catch {}
}

async function extractTextFromPdfBuffer(buffer) {
  await ensureDOMMatrix()
  const g = globalThis
  if (g.pdfjsWorker == null) {
    try {
      await import('pdfjs-dist/legacy/build/pdf.worker.mjs')
    } catch {}
  }
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(buffer)
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
  const page = await doc.getPage(1)
  const content = await page.getTextContent()
  const text = content.items.map((item) => item.str ?? '').join(' ')
  return text.trim() || '(No text extracted from PDF)'
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
