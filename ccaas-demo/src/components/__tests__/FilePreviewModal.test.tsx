/**
 * FilePreviewModal Component Tests
 *
 * Tests for the file preview modal including:
 * - Text file preview
 * - Image preview
 * - Loading state
 * - Truncation warning
 * - Keyboard navigation (Escape to close)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilePreviewModal } from '../FilePreviewModal'
import type { FileNode, FilePreview } from '../../types'

describe('FilePreviewModal', () => {
  const mockFile: FileNode = {
    id: 'file-1',
    name: 'readme.md',
    type: 'file',
    path: '/docs/readme.md',
    fileId: 'uuid-1',
    mimeType: 'text/markdown',
    size: 1024,
    status: 'new',
  }

  const mockTextPreview: FilePreview = {
    content: '# Hello World\n\nThis is a markdown file.',
    truncated: false,
    encoding: 'utf8',
    mimeType: 'text/markdown',
    size: 1024,
  }

  const mockImagePreview: FilePreview = {
    content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    truncated: false,
    encoding: 'base64',
    mimeType: 'image/png',
    size: 100,
  }

  const defaultProps = {
    file: mockFile,
    preview: mockTextPreview,
    loading: false,
    onClose: vi.fn(),
    onDownload: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('should not render when file is null', () => {
      render(<FilePreviewModal {...defaultProps} file={null} />)

      expect(screen.queryByText('readme.md')).not.toBeInTheDocument()
    })

    it('should render file name in header', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(screen.getByText('readme.md')).toBeInTheDocument()
    })

    it('should render file path', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(screen.getByText('/docs/readme.md')).toBeInTheDocument()
    })

    it('should render file size', () => {
      render(<FilePreviewModal {...defaultProps} />)

      // 1024 bytes = "1.0 KB"
      expect(screen.getByText('1.0 KB')).toBeInTheDocument()
    })

    it('should render download button', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(screen.getByText('Download')).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(screen.getByTitle('Close')).toBeInTheDocument()
    })
  })

  describe('text preview', () => {
    it('should render text content in code block', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(screen.getByText(/Hello World/)).toBeInTheDocument()
    })

    it('should show MIME type in footer', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(screen.getByText(/text\/markdown/)).toBeInTheDocument()
    })
  })

  describe('image preview', () => {
    it('should render image as img element', () => {
      const imageFile: FileNode = {
        ...mockFile,
        name: 'image.png',
        mimeType: 'image/png',
      }

      render(
        <FilePreviewModal
          {...defaultProps}
          file={imageFile}
          preview={mockImagePreview}
        />
      )

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute(
        'src',
        expect.stringContaining('data:image/png;base64,')
      )
    })

    it('should set alt text to file name', () => {
      const imageFile: FileNode = {
        ...mockFile,
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
      }

      render(
        <FilePreviewModal
          {...defaultProps}
          file={imageFile}
          preview={mockImagePreview}
        />
      )

      expect(screen.getByAltText('photo.jpg')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      render(<FilePreviewModal {...defaultProps} loading={true} preview={null} />)

      expect(screen.getByText(/Loading preview/)).toBeInTheDocument()
    })
  })

  describe('no preview available', () => {
    it('should show message when preview is null', () => {
      render(<FilePreviewModal {...defaultProps} preview={null} />)

      expect(screen.getByText('Preview not available')).toBeInTheDocument()
    })

    it('should show download button as fallback', () => {
      render(<FilePreviewModal {...defaultProps} preview={null} />)

      expect(screen.getByText('Download instead')).toBeInTheDocument()
    })
  })

  describe('truncation warning', () => {
    it('should show warning when content is truncated', () => {
      const truncatedPreview: FilePreview = {
        ...mockTextPreview,
        truncated: true,
        size: 200000,
      }

      render(<FilePreviewModal {...defaultProps} preview={truncatedPreview} />)

      expect(screen.getByText(/truncated/i)).toBeInTheDocument()
    })

    it('should not show warning when content is not truncated', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(screen.queryByText(/truncated/i)).not.toBeInTheDocument()
    })
  })

  describe('binary file preview', () => {
    it('should show binary file message for non-text/image files', () => {
      const binaryFile: FileNode = {
        ...mockFile,
        name: 'archive.zip',
        mimeType: 'application/zip',
      }

      const binaryPreview: FilePreview = {
        content: 'UEsDBBQAAAAI...',
        truncated: false,
        encoding: 'base64',
        mimeType: 'application/zip',
        size: 5000,
      }

      render(
        <FilePreviewModal
          {...defaultProps}
          file={binaryFile}
          preview={binaryPreview}
        />
      )

      expect(screen.getByText(/Binary file/i)).toBeInTheDocument()
      expect(screen.getByText('Download file')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onClose when close button clicked', () => {
      const onClose = vi.fn()
      render(<FilePreviewModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByTitle('Close'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop clicked', () => {
      const onClose = vi.fn()
      const { container } = render(
        <FilePreviewModal {...defaultProps} onClose={onClose} />
      )

      // Click on backdrop (the outer div)
      const backdrop = container.firstChild as HTMLElement
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close when modal content clicked', () => {
      const onClose = vi.fn()
      render(<FilePreviewModal {...defaultProps} onClose={onClose} />)

      // Click on modal content
      fireEvent.click(screen.getByText('readme.md'))

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should call onDownload when download button clicked', () => {
      const onDownload = vi.fn()
      render(<FilePreviewModal {...defaultProps} onDownload={onDownload} />)

      fireEvent.click(screen.getByText('Download'))

      expect(onDownload).toHaveBeenCalledWith(mockFile)
    })

    it('should close on Escape key press', () => {
      const onClose = vi.fn()
      render(<FilePreviewModal {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('body scroll lock', () => {
    it('should lock body scroll when open', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll when closed', () => {
      const { rerender } = render(<FilePreviewModal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')

      rerender(<FilePreviewModal {...defaultProps} file={null} />)

      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('status display', () => {
    it('should show new status indicator', () => {
      render(<FilePreviewModal {...defaultProps} />)

      expect(screen.getByText(/New/)).toBeInTheDocument()
    })

    it('should show synced status indicator', () => {
      const syncedFile: FileNode = {
        ...mockFile,
        status: 'synced',
      }

      render(<FilePreviewModal {...defaultProps} file={syncedFile} />)

      expect(screen.getByText(/Synced/)).toBeInTheDocument()
    })

    it('should show modified status indicator', () => {
      const modifiedFile: FileNode = {
        ...mockFile,
        status: 'modified',
      }

      render(<FilePreviewModal {...defaultProps} file={modifiedFile} />)

      expect(screen.getByText(/Modified/)).toBeInTheDocument()
    })
  })
})
