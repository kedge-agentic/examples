/**
 * Drop Zone
 *
 * Empty state placeholder with drag-drop and click-to-upload support.
 */

import { useRef, useCallback, ChangeEvent } from 'react'

interface DropZoneProps {
  isEmpty: boolean
  onUploadFiles?: (files: File[]) => Promise<void>
  disabled?: boolean
}

export function DropZone({ isEmpty, onUploadFiles, disabled }: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0 && onUploadFiles) {
      onUploadFiles(files)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onUploadFiles])

  if (!isEmpty) return null

  return (
    <div
      className={`flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg m-2 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50'
      }`}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <span className="text-4xl mb-3">📂</span>
      <p className="text-sm font-medium">No files yet</p>
      <p className="text-xs mt-2 text-center px-4">
        Files created by the AI will appear here.
        <br />
        Drag and drop or <span className="text-blue-500 underline">click to upload</span>.
      </p>
    </div>
  )
}
