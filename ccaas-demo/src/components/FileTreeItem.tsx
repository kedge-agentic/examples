/**
 * File Tree Item
 *
 * Recursive component for rendering file/folder nodes
 * with status badges, icons, and expand/collapse support.
 */

import type { FileNode, FileStatus } from '../types'

interface FileTreeItemProps {
  node: FileNode
  depth: number
  expandedFolders: Set<string>
  onToggleFolder: (folderId: string) => void
  onPreviewFile: (file: FileNode) => void
  onDownloadFile: (file: FileNode) => void
}

// Get file icon based on MIME type
function getFileIcon(mimeType?: string, filename?: string): string {
  if (!mimeType && filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    const extIcons: Record<string, string> = {
      md: '📝',
      txt: '📄',
      json: '📋',
      ts: '🔷',
      tsx: '🔷',
      js: '🟨',
      jsx: '🟨',
      html: '🌐',
      css: '🎨',
      py: '🐍',
      pdf: '📕',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️',
      svg: '🖼️',
      zip: '📦',
      yaml: '⚙️',
      yml: '⚙️',
    }
    return extIcons[ext || ''] || '📄'
  }

  if (!mimeType) return '📄'

  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType === 'application/json') return '📋'
  if (mimeType.includes('javascript') || mimeType.includes('typescript')) return '🔷'
  if (mimeType.startsWith('text/')) return '📄'

  return '📄'
}

// Get status badge
function getStatusBadge(status?: FileStatus): React.ReactNode {
  if (!status) return null

  const badges: Record<FileStatus, { label: string; className: string }> = {
    new: { label: 'NEW', className: 'bg-blue-500 text-white' },
    modified: { label: 'MOD', className: 'bg-amber-500 text-white' },
    synced: { label: '✓', className: 'bg-green-500 text-white' },
  }

  const badge = badges[status]
  if (!badge) return null

  return (
    <span className={`text-[10px] px-1 py-0.5 rounded ${badge.className}`}>
      {badge.label}
    </span>
  )
}

// Format file size
function formatSize(bytes?: number): string {
  if (bytes === undefined) return ''

  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileTreeItem({
  node,
  depth,
  expandedFolders,
  onToggleFolder,
  onPreviewFile,
  onDownloadFile,
}: FileTreeItemProps) {
  const isFolder = node.type === 'folder'
  const isExpanded = expandedFolders.has(node.id)
  const paddingLeft = depth * 16 + 8

  if (isFolder) {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.id)}
          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded transition-colors text-left"
          style={{ paddingLeft }}
        >
          <span className="text-gray-400 text-xs w-4">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span>📁</span>
          <span className="text-sm font-medium text-gray-700 truncate flex-1">
            {node.name}
          </span>
          {node.children && node.children.length > 0 && (
            <span className="text-xs text-gray-400">
              {node.children.length}
            </span>
          )}
        </button>

        {isExpanded && node.children && (
          <div>
            {node.children.map(child => (
              <FileTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onPreviewFile={onPreviewFile}
                onDownloadFile={onDownloadFile}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // File node
  return (
    <div
      className="group flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      style={{ paddingLeft: paddingLeft + 16 }}
      onClick={() => onPreviewFile(node)}
    >
      <span>{getFileIcon(node.mimeType, node.name)}</span>
      <span className="text-sm text-gray-700 truncate flex-1" title={node.path}>
        {node.name}
      </span>
      {getStatusBadge(node.status)}
      {node.uploadedBy === 'user' && (
        <span className="text-[10px] text-gray-400" title="User uploaded">
          👤
        </span>
      )}
      {node.size !== undefined && (
        <span className="text-xs text-gray-400 hidden group-hover:block">
          {formatSize(node.size)}
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDownloadFile(node)
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
        title="Download"
      >
        ⬇️
      </button>
    </div>
  )
}
