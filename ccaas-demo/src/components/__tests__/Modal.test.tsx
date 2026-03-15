/**
 * Modal Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = ''
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    fireEvent.click(screen.getByLabelText('Close modal'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    // Click on backdrop (the element with bg-black/50)
    const backdrop = document.querySelector('.bg-black\\/50')
    if (backdrop) {
      fireEvent.click(backdrop)
    }
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside modal content', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    fireEvent.click(screen.getByText('Content'))
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('applies correct size class for sm size', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test" size="sm">
        <p>Content</p>
      </Modal>
    )
    expect(document.querySelector('.max-w-md')).toBeInTheDocument()
  })

  it('applies correct size class for lg size', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test" size="lg">
        <p>Content</p>
      </Modal>
    )
    expect(document.querySelector('.max-w-2xl')).toBeInTheDocument()
  })

  it('applies correct size class for xl size', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test" size="xl">
        <p>Content</p>
      </Modal>
    )
    expect(document.querySelector('.max-w-4xl')).toBeInTheDocument()
  })

  it('sets body overflow to hidden when open', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    )
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('has correct ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })
})
