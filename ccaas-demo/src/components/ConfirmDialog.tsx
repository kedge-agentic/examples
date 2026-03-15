/**
 * ConfirmDialog Component
 *
 * A confirmation dialog for destructive actions.
 * Includes proper ARIA attributes for accessibility.
 */

import { useEffect, useRef, useId } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  confirmVariant?: 'danger' | 'primary'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  // Handle escape key and focus management
  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus the cancel button by default (safer action)
    const cancelButton = dialogRef.current?.querySelector('[data-cancel]') as HTMLElement
    cancelButton?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={dialogRef}
          className="relative w-full max-w-md bg-white rounded-xl shadow-xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h3>
                <p id={descriptionId} className="mt-2 text-sm text-gray-500">{message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                data-cancel
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmButtonClass}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
