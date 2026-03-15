/**
 * ConfirmDialog Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnConfirm = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnConfirm.mockClear()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm"
        message="Are you sure?"
      />
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('renders dialog when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
  })

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure?"
        confirmText="Delete"
      />
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm and onClose when Confirm button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure?"
        confirmText="Delete"
      />
    )
    fireEvent.click(screen.getByText('Delete'))
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('uses custom confirmText', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Remove Item"
        message="Remove this item?"
        confirmText="Remove"
      />
    )
    const buttons = screen.getAllByRole('button')
    const confirmButton = buttons.find(b => b.textContent === 'Remove')
    expect(confirmButton).toBeInTheDocument()
  })

  it('calls onClose when Escape key is pressed', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure?"
      />
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure?"
      />
    )
    const backdrop = document.querySelector('.bg-black\\/50')
    if (backdrop) {
      fireEvent.click(backdrop)
    }
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('applies danger styling by default', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Warning"
        message="Are you sure?"
        confirmText="Delete"
        confirmVariant="danger"
      />
    )
    const buttons = screen.getAllByRole('button')
    const confirmButton = buttons.find(b => b.textContent === 'Delete')
    expect(confirmButton?.className).toContain('bg-red-600')
  })

  it('applies primary styling when specified', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Info"
        message="Are you sure?"
        confirmText="Proceed"
        confirmVariant="primary"
      />
    )
    const buttons = screen.getAllByRole('button')
    const confirmButton = buttons.find(b => b.textContent === 'Proceed')
    expect(confirmButton?.className).toContain('bg-blue-600')
  })

  it('has correct ARIA attributes', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure?"
      />
    )
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
    expect(dialog).toHaveAttribute('aria-describedby')
  })
})
