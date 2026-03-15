import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileCard, getFileTypeLabel, formatFileSize } from '../FileCard'
import type { FileInfo } from '../../types'

describe('getFileTypeLabel', () => {
  it('returns label from MIME type when available', () => {
    expect(getFileTypeLabel('text/markdown', 'file.md')).toBe('Markdown')
    expect(getFileTypeLabel('application/json', 'data.json')).toBe('JSON')
    expect(getFileTypeLabel('text/typescript', 'app.ts')).toBe('TypeScript')
    expect(getFileTypeLabel('text/javascript', 'script.js')).toBe('JavaScript')
    expect(getFileTypeLabel('text/plain', 'readme.txt')).toBe('Text')
    expect(getFileTypeLabel('text/html', 'index.html')).toBe('HTML')
    expect(getFileTypeLabel('text/css', 'styles.css')).toBe('CSS')
  })

  it('falls back to extension when MIME type is unknown', () => {
    expect(getFileTypeLabel('unknown', 'file.md')).toBe('Markdown')
    expect(getFileTypeLabel('unknown', 'data.json')).toBe('JSON')
    expect(getFileTypeLabel('unknown', 'script.ts')).toBe('TypeScript')
    expect(getFileTypeLabel('unknown', 'app.tsx')).toBe('TypeScript')
    expect(getFileTypeLabel('unknown', 'main.js')).toBe('JavaScript')
  })

  it('returns "File" for completely unknown types', () => {
    expect(getFileTypeLabel('unknown', 'data.xyz')).toBe('File')
    expect(getFileTypeLabel('', 'noextension')).toBe('File')
    expect(getFileTypeLabel('application/octet-stream', 'binary.bin')).toBe('File')
  })
})

describe('formatFileSize', () => {
  it('returns string values as-is', () => {
    expect(formatFileSize('Calculating...')).toBe('Calculating...')
    expect(formatFileSize('Unknown')).toBe('Unknown')
  })

  it('formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(10240)).toBe('10.0 KB')
    expect(formatFileSize(1024 * 1024 - 1)).toBe('1024.0 KB')
  })

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB')
  })
})

describe('FileCard', () => {
  const mockFile: FileInfo = {
    id: 'file-123',
    name: 'report.md',
    size: 2048,
    type: 'text/markdown',
  }

  it('renders file name', () => {
    render(<FileCard file={mockFile} onDownload={() => {}} />)
    expect(screen.getByText('report.md')).toBeInTheDocument()
  })

  it('displays formatted size with type label', () => {
    render(<FileCard file={mockFile} onDownload={() => {}} />)
    expect(screen.getByText('Markdown · 2.0 KB')).toBeInTheDocument()
  })

  it('calls onDownload when button clicked', () => {
    const handleDownload = vi.fn()
    render(<FileCard file={mockFile} onDownload={handleDownload} />)

    fireEvent.click(screen.getByRole('button', { name: /download/i }))
    expect(handleDownload).toHaveBeenCalledWith(mockFile)
  })

  it('handles files with "Calculating..." size', () => {
    const calculatingFile: FileInfo = {
      name: 'pending.json',
      size: 'Calculating...',
      type: 'application/json',
    }
    render(<FileCard file={calculatingFile} onDownload={() => {}} />)
    expect(screen.getByText('JSON · Calculating...')).toBeInTheDocument()
  })

  it('handles unknown MIME type by deriving from extension', () => {
    const unknownTypeFile: FileInfo = {
      name: 'config.yaml',
      size: 512,
      type: 'unknown',
    }
    render(<FileCard file={unknownTypeFile} onDownload={() => {}} />)
    expect(screen.getByText('YAML · 512 B')).toBeInTheDocument()
  })

  it('handles completely unknown file types gracefully', () => {
    const unknownFile: FileInfo = {
      name: 'data.xyz',
      size: 1024,
      type: 'application/octet-stream',
    }
    render(<FileCard file={unknownFile} onDownload={() => {}} />)
    expect(screen.getByText('File · 1.0 KB')).toBeInTheDocument()
  })
})
