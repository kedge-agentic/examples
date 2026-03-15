/**
 * DropZone Component Tests
 *
 * Tests for the empty state drop zone component with click-to-upload.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DropZone } from '../DropZone'

describe('DropZone', () => {
  describe('rendering', () => {
    it('should render when isEmpty is true', () => {
      render(<DropZone isEmpty={true} />)

      expect(screen.getByText('No files yet')).toBeInTheDocument()
    })

    it('should not render when isEmpty is false', () => {
      render(<DropZone isEmpty={false} />)

      expect(screen.queryByText('No files yet')).not.toBeInTheDocument()
    })

    it('should show drag and drop hint', () => {
      render(<DropZone isEmpty={true} />)

      expect(screen.getByText(/Drag and drop/)).toBeInTheDocument()
    })

    it('should show click to upload hint', () => {
      render(<DropZone isEmpty={true} />)

      expect(screen.getByText(/click to upload/)).toBeInTheDocument()
    })

    it('should mention AI-created files', () => {
      render(<DropZone isEmpty={true} />)

      expect(screen.getByText(/Files created by the AI/)).toBeInTheDocument()
    })

    it('should render folder icon', () => {
      render(<DropZone isEmpty={true} />)

      expect(screen.getByText('📂')).toBeInTheDocument()
    })
  })

  describe('click to upload', () => {
    it('should have a hidden file input', () => {
      render(<DropZone isEmpty={true} />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveClass('hidden')
    })

    it('should support multiple file selection', () => {
      render(<DropZone isEmpty={true} />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('multiple')
    })

    it('should call onUploadFiles when files are selected', () => {
      const onUploadFiles = vi.fn().mockResolvedValue(undefined)
      render(<DropZone isEmpty={true} onUploadFiles={onUploadFiles} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(onUploadFiles).toHaveBeenCalledWith([testFile])
    })

    it('should not call onUploadFiles when no files selected', () => {
      const onUploadFiles = vi.fn().mockResolvedValue(undefined)
      render(<DropZone isEmpty={true} onUploadFiles={onUploadFiles} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(onUploadFiles).not.toHaveBeenCalled()
    })
  })

  describe('disabled state', () => {
    it('should disable file input when disabled', () => {
      render(<DropZone isEmpty={true} disabled={true} />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeDisabled()
    })

    it('should show reduced opacity when disabled', () => {
      render(<DropZone isEmpty={true} disabled={true} />)

      const container = screen.getByText('No files yet').closest('div')
      expect(container).toHaveClass('opacity-50')
    })
  })
})
