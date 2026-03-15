/**
 * File Preview Modal
 *
 * Modal dialog for previewing file contents.
 * Supports text files, images, and shows truncation warnings.
 */

import { useEffect } from 'react'
import type { FileNode, FilePreview } from '../types'

interface FilePreviewModalProps {
  file: FileNode | null
  preview: FilePreview | null
  loading: boolean
  onClose: () => void
  onDownload: (file: FileNode) => void
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Get language class for syntax highlighting hint
function getLanguageHint(mimeType: string, filename?: string): string {
  const ext = filename?.split('.').pop()?.toLowerCase()

  const langMap: Record<string, string> = {
    'application/json': 'json',
    'text/javascript': 'javascript',
    'application/javascript': 'javascript',
    'text/typescript': 'typescript',
    'application/typescript': 'typescript',
    'text/html': 'html',
    'text/css': 'css',
    'text/markdown': 'markdown',
    'text/x-python': 'python',
    'application/xml': 'xml',
  }

  if (langMap[mimeType]) return langMap[mimeType]

  const extLangMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    py: 'python',
    html: 'html',
    css: 'css',
    yaml: 'yaml',
    yml: 'yaml',
  }

  return extLangMap[ext || ''] || 'text'
}

export function FilePreviewModal({
  file,
  preview,
  loading,
  onClose,
  onDownload,
}: FilePreviewModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (file) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [file])

  if (!file) return null

  const isImage = preview?.mimeType.startsWith('image/')
  const isText = preview?.encoding === 'utf8'
  const language = preview ? getLanguageHint(preview.mimeType, file.name) : 'text'

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">📄</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{file.name}</h3>
              <p className="text-sm text-gray-500 truncate">{file.path}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {preview && (
              <span className="text-sm text-gray-500">
                {formatSize(preview.size)}
              </span>
            )}
            <button
              onClick={() => onDownload(file)}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="animate-spin text-2xl">⏳</span>
              <span className="ml-2 text-gray-500">Loading preview...</span>
            </div>
          ) : !preview ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <span className="text-4xl mb-4">❌</span>
              <p>Preview not available</p>
              <button
                onClick={() => onDownload(file)}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Download instead
              </button>
            </div>
          ) : isImage ? (
            <div className="flex flex-col items-center">
              <img
                src={`data:${preview.mimeType};base64,${preview.content}`}
                alt={file.name}
                className="max-w-full max-h-[60vh] object-contain rounded shadow"
              />
              {preview.truncated && (
                <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
                  Image preview is truncated. Download for full resolution.
                </div>
              )}
            </div>
          ) : isText ? (
            <div className="flex flex-col h-full">
              <pre className="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto text-sm font-mono whitespace-pre-wrap break-words">
                <code className={`language-${language}`}>{preview.content}</code>
              </pre>
              {preview.truncated && (
                <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
                  Content truncated at 100KB. Download for full file.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <span className="text-4xl mb-4">📦</span>
              <p>Binary file - preview not available</p>
              <p className="text-sm mt-2">Type: {preview.mimeType}</p>
              <button
                onClick={() => onDownload(file)}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Download file
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500 flex items-center justify-between">
            <span>
              Type: {preview.mimeType}
            </span>
            <span>
              {file.status === 'new' && '🔵 New'}
              {file.status === 'modified' && '🟡 Modified'}
              {file.status === 'synced' && '✅ Synced'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
