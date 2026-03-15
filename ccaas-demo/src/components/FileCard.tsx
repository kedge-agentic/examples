/**
 * File Card Component
 *
 * Displays a file with download button.
 * Shows file type label and formatted size.
 */

import type { FileInfo } from '../types'

interface FileCardProps {
  file: FileInfo
  onDownload: (file: FileInfo) => void
}

/**
 * Get a human-readable file type label from MIME type or filename extension.
 */
export function getFileTypeLabel(type: string, filename: string): string {
  // First try to derive from MIME type
  if (type && type !== 'unknown') {
    if (type.includes('markdown')) return 'Markdown'
    if (type.includes('json')) return 'JSON'
    if (type.includes('javascript')) return 'JavaScript'
    if (type.includes('typescript')) return 'TypeScript'
    if (type.includes('plain')) return 'Text'
    if (type.includes('html')) return 'HTML'
    if (type.includes('css')) return 'CSS'
    if (type.includes('yaml') || type.includes('yml')) return 'YAML'
    if (type.includes('xml')) return 'XML'
    if (type.includes('python')) return 'Python'
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('docx') || type.includes('word')) return 'Word'
  }

  // Fallback to extension
  const ext = filename.split('.').pop()?.toLowerCase()
  const extMap: Record<string, string> = {
    md: 'Markdown',
    json: 'JSON',
    txt: 'Text',
    ts: 'TypeScript',
    tsx: 'TypeScript',
    js: 'JavaScript',
    jsx: 'JavaScript',
    html: 'HTML',
    css: 'CSS',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    py: 'Python',
    pdf: 'PDF',
    docx: 'Word',
    doc: 'Word',
  }
  return extMap[ext || ''] || 'File'
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number | string): string {
  if (typeof bytes === 'string') return bytes // "Calculating..." or similar
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get an appropriate emoji icon for the file type.
 */
function getFileIcon(type: string, filename: string): string {
  const label = getFileTypeLabel(type, filename)
  const iconMap: Record<string, string> = {
    Markdown: '📄',
    JSON: '📋',
    Text: '📝',
    TypeScript: '💠',
    JavaScript: '📜',
    HTML: '🌐',
    CSS: '🎨',
    YAML: '⚙️',
    XML: '📰',
    Python: '🐍',
    PDF: '📕',
    Word: '📘',
  }
  return iconMap[label] || '📎'
}

export function FileCard({ file, onDownload }: FileCardProps) {
  const typeLabel = getFileTypeLabel(file.type, file.name)
  const sizeDisplay = formatFileSize(file.size)

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 mt-3 animate-slide-in">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getFileIcon(file.type, file.name)}</span>
        <div>
          <p className="font-medium text-gray-900">{file.name}</p>
          <p className="text-sm text-gray-500">{typeLabel} · {sizeDisplay}</p>
        </div>
      </div>
      <button
        onClick={() => onDownload(file)}
        className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
      >
        Download
      </button>
    </div>
  )
}
