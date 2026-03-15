/**
 * File Browser Panel
 *
 * Main panel component displaying the file tree with
 * collapsible folders, status indicators, and drag-drop upload.
 */

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react'
import { FileTreeItem } from './FileTreeItem'
import { FilePreviewModal } from './FilePreviewModal'
import { DropZone } from './DropZone'
import type { FileNode, FilePreview } from '../types'

interface FileBrowserPanelProps {
  tree: FileNode[]
  expandedFolders: Set<string>
  loading: boolean
  error: string | null
  previewFile: FileNode | null
  previewContent: FilePreview | null
  previewLoading: boolean
  collapsed: boolean
  uploading?: boolean
  onToggleCollapse: () => void
  onToggleFolder: (folderId: string) => void
  onPreviewFile: (file: FileNode) => void
  onClosePreview: () => void
  onDownloadFile: (file: FileNode) => void
  onRefresh: () => void
  onUploadFiles?: (files: File[]) => Promise<void>
}

export function FileBrowserPanel({
  tree,
  expandedFolders,
  loading,
  error,
  previewFile,
  previewContent,
  previewLoading,
  collapsed,
  uploading,
  onToggleCollapse,
  onToggleFolder,
  onPreviewFile,
  onClosePreview,
  onDownloadFile,
  onRefresh,
  onUploadFiles,
}: FileBrowserPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Click to upload handler
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0 && onUploadFiles) {
      onUploadFiles(files)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onUploadFiles])

  // Count files (including nested)
  const countFiles = useCallback((nodes: FileNode[]): number => {
    let count = 0
    for (const node of nodes) {
      if (node.type === 'file') {
        count++
      } else if (node.children) {
        count += countFiles(node.children)
      }
    }
    return count
  }, [])

  // Count new files
  const countNewFiles = useCallback((nodes: FileNode[]): number => {
    let count = 0
    for (const node of nodes) {
      if (node.type === 'file' && node.status === 'new') {
        count++
      } else if (node.children) {
        count += countNewFiles(node.children)
      }
    }
    return count
  }, [])

  const totalFiles = countFiles(tree)
  const newFiles = countNewFiles(tree)

  // Drag and drop handlers
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!onUploadFiles) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await onUploadFiles(files)
    }
  }, [onUploadFiles])

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 flex flex-col">
        <button
          onClick={onToggleCollapse}
          className="p-3 hover:bg-gray-100 transition-colors"
          title="Expand File Browser"
        >
          <span className="text-lg">📁</span>
        </button>
        {newFiles > 0 && (
          <div className="mx-auto mt-2 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
            {newFiles}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`w-80 bg-white border-l border-gray-200 flex flex-col transition-all relative ${
        isDragOver ? 'bg-blue-50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📁</span>
          <h2 className="font-semibold text-gray-900">Files</h2>
          {totalFiles > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {totalFiles}
            </span>
          )}
          {newFiles > 0 && (
            <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">
              {newFiles} NEW
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title="Upload files"
          >
            <span>📤</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Collapse"
          >
            <span>◀</span>
          </button>
        </div>
        {/* Hidden file input for click-to-upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={uploading}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading && tree.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <span className="animate-spin mr-2">⏳</span>
            Loading files...
          </div>
        ) : tree.length === 0 ? (
          <DropZone isEmpty={true} onUploadFiles={onUploadFiles} disabled={uploading} />
        ) : (
          <div className="space-y-0.5">
            {tree.map(node => (
              <FileTreeItem
                key={node.id}
                node={node}
                depth={0}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onPreviewFile={onPreviewFile}
                onDownloadFile={onDownloadFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none z-10">
          <div className="text-blue-600 font-medium">
            Drop files here to upload
          </div>
        </div>
      )}

      {/* Uploading Indicator */}
      {uploading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-blue-600">
            <span className="animate-spin">⏳</span>
            <span className="font-medium">Uploading...</span>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        preview={previewContent}
        loading={previewLoading}
        onClose={onClosePreview}
        onDownload={onDownloadFile}
      />
    </div>
  )
}
