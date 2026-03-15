import { useState, useMemo, useCallback } from 'react'
import { useWorkspaceFiles } from '../../hooks/useWorkspaceFiles'
import { useFileDownload } from '../../hooks/useFileDownload'
import { FileExplorerHeader } from './FileExplorerHeader'
import { FileTree } from './FileTree'
import { filterTree, sortTree } from '../../utils/fileUtils'
import type { FileTreeNode } from '../../types'

interface FileExplorerProps {
  sessionId: string
  className?: string
  onFileSelect?: (file: FileTreeNode) => void
}

/**
 * FileExplorer - Main container for workspace file explorer
 * Displays session workspace files in a tree structure with search, sort, and download
 */
export function FileExplorer({ sessionId, className = '', onFileSelect }: FileExplorerProps) {
  const { tree, loading, error, refetch } = useWorkspaceFiles(sessionId)
  const { downloadFile, downloading } = useFileDownload()

  // State
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'type'>('name')
  const [sortOrder] = useState<'asc' | 'desc'>('asc')

  // Toggle folder expand/collapse
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  // Expand all folders
  const expandAll = useCallback(() => {
    const allFolderIds = new Set<string>()
    const collectFolderIds = (nodes: FileTreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'folder') {
          allFolderIds.add(node.id)
          if (node.children) {
            collectFolderIds(node.children)
          }
        }
      })
    }
    collectFolderIds(tree)
    setExpandedFolders(allFolderIds)
  }, [tree])

  // Collapse all folders
  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set())
  }, [])

  // Handle file click (download)
  const handleFileClick = useCallback(async (file: FileTreeNode) => {
    if (file.type === 'file') {
      try {
        await downloadFile(sessionId, file.path, file.name)
        onFileSelect?.(file)
      } catch (err) {
        console.error('Failed to download file:', err)
        alert(`Failed to download ${file.name}`)
      }
    }
  }, [sessionId, downloadFile, onFileSelect])

  // Filter and sort tree
  const processedTree = useMemo(() => {
    let result = tree
    if (searchQuery) {
      result = filterTree(result, searchQuery)
    }
    result = sortTree(result, sortBy, sortOrder)
    return result
  }, [tree, searchQuery, sortBy, sortOrder])

  return (
    <div className={`file-explorer flex flex-col h-full bg-slate-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Workspace Files</h2>
        <FileExplorerHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onRefresh={refetch}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
            <p className="text-sm text-slate-400">Loading files...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-400 mb-1">Failed to load files</h3>
                <p className="text-sm text-red-300">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-2 px-3 py-1.5 text-xs bg-red-800 hover:bg-red-700 text-red-100 rounded-md transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Tree */}
        {!loading && !error && (
          <FileTree
            nodes={processedTree}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onFileClick={handleFileClick}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Footer - Download Status */}
      {downloading.size > 0 && (
        <div className="border-t border-slate-700 p-3 bg-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
            <span>Downloading {downloading.size} file{downloading.size > 1 ? 's' : ''}...</span>
          </div>
        </div>
      )}
    </div>
  )
}
