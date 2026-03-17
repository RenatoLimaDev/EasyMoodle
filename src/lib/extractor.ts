declare const mammoth: { extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> }

function detectEncoding(bytes: Uint8Array): string {
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'utf-8'
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le'
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be'
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  const replacements = (utf8.match(/\uFFFD/g) || []).length
  return replacements > 2 ? 'windows-1252' : 'utf-8'
}

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.docx')) {
    const buf = await file.arrayBuffer()
    // mammoth loaded via CDN in index.html for browser compat
    const win = window as unknown as { mammoth: typeof mammoth }
    const result = await win.mammoth.extractRawText({ arrayBuffer: buf })
    return result.value
  }

  const buf   = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const enc   = detectEncoding(bytes)
  return new TextDecoder(enc).decode(bytes)
}

export function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/xml;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
