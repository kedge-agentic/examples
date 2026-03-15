/**
 * File Browser Hook
 *
 * Manages file tree state, file operations (preview, download, upload),
 * and real-time updates via WebSocket events.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import type { FileNode, FilePreview, FileCreatedEvent, FileStatus } from '../types'

// Backend configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
const API_KEY = import.meta.env.VITE_API_KEY || ''

// API helper
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

interface FileBrowserState {
  tree: FileNode[]
  expandedFolders: Set<string>
  loading: boolean
  error: string | null
  previewFile: FileNode | null
  previewContent: FilePreview | null
  previewLoading: boolean
}

interface UseFileBrowserOptions {
  sessionId: string
  socket: Socket | null
}

export function useFileBrowser({ sessionId, socket }: UseFileBrowserOptions) {
  const [state, setState] = useState<FileBrowserState>({
    tree: [],
    expandedFolders: new Set(),
    loading: false,
    error: null,
    previewFile: null,
    previewContent: null,
    previewLoading: false,
  })

  const sessionIdRef = useRef(sessionId)

  // Update sessionId ref when it changes
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  // Fetch file tree from backend
  const fetchFileTree = useCallback(async () => {
    if (!sessionId) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetchAPI<{ tree: FileNode[] }>(
        `/api/v1/files/session/${sessionId}/tree`
      )
      setState(prev => ({
        ...prev,
        tree: response.tree,
        loading: false,
      }))
    } catch (err) {
      console.error('Failed to fetch file tree:', err)
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch file tree',
      }))
    }
  }, [sessionId])

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedFolders)
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId)
      } else {
        newExpanded.add(folderId)
      }
      return { ...prev, expandedFolders: newExpanded }
    })
  }, [])

  // Preview a file
  const openPreview = useCallback(async (file: FileNode) => {
    if (!file.fileId) return

    setState(prev => ({
      ...prev,
      previewFile: file,
      previewContent: null,
      previewLoading: true,
    }))

    try {
      const preview = await fetchAPI<FilePreview>(
        `/api/v1/files/${file.fileId}/preview`
      )
      setState(prev => ({
        ...prev,
        previewContent: preview,
        previewLoading: false,
      }))
    } catch (err) {
      console.error('Failed to preview file:', err)
      setState(prev => ({
        ...prev,
        previewLoading: false,
        error: err instanceof Error ? err.message : 'Failed to preview file',
      }))
    }
  }, [])

  // Close preview
  const closePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      previewFile: null,
      previewContent: null,
    }))
  }, [])

  // Download a file and mark as synced
  const downloadFile = useCallback(async (file: FileNode) => {
    if (!file.fileId) return

    // Open download in new tab
    window.open(`${BACKEND_URL}/api/v1/files/${file.fileId}/download`, '_blank')

    // Mark as synced
    try {
      await fetchAPI<{ success: boolean }>(
        `/api/v1/files/${file.fileId}/sync`,
        { method: 'POST' }
      )

      // Update local state to reflect synced status
      setState(prev => ({
        ...prev,
        tree: updateFileStatus(prev.tree, file.fileId!, 'synced'),
      }))
    } catch (err) {
      console.error('Failed to mark file as synced:', err)
    }
  }, [])

  // Upload a file (messageId is optional for user uploads)
  const uploadFile = useCallback(async (
    file: File,
    targetPath?: string
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sessionId', sessionIdRef.current)
    if (targetPath) {
      formData.append('targetPath', targetPath)
    }

    try {
      const result = await fetchAPI<FileNode>(
        '/api/v1/files/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      // Refresh tree after upload
      await fetchFileTree()

      return result
    } catch (err) {
      console.error('Failed to upload file:', err)
      throw err
    }
  }, [fetchFileTree])

  // Add file to tree (for real-time updates)
  const addFileToTree = useCallback((event: FileCreatedEvent) => {
    const { payload } = event

    // Create new file node
    const newFile: FileNode = {
      id: `file-${payload.id}`,
      name: payload.filename,
      type: 'file',
      path: payload.originalPath,
      fileId: payload.id,
      mimeType: payload.mimeType || undefined,
      size: payload.size,
      status: payload.status,
      uploadedBy: payload.uploadedBy,
      createdAt: new Date(payload.createdAt),
    }

    setState(prev => {
      const newTree = insertFileIntoTree([...prev.tree], newFile, payload.originalPath)
      return { ...prev, tree: newTree }
    })
  }, [])

  // Listen for file_created events
  useEffect(() => {
    if (!socket) return

    const handleFileCreated = (event: FileCreatedEvent) => {
      console.log('File created event:', event)
      // Only process events for the current session
      if (event.payload.sessionId === sessionIdRef.current) {
        addFileToTree(event)
      }
    }

    socket.on('file_created', handleFileCreated)

    return () => {
      socket.off('file_created', handleFileCreated)
    }
  }, [socket, addFileToTree])

  // Fetch file tree when session changes
  useEffect(() => {
    if (sessionId) {
      fetchFileTree()
    }
  }, [sessionId, fetchFileTree])

  // Reset state when session changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      tree: [],
      expandedFolders: new Set(),
      previewFile: null,
      previewContent: null,
    }))
  }, [sessionId])

  return {
    tree: state.tree,
    expandedFolders: state.expandedFolders,
    loading: state.loading,
    error: state.error,
    previewFile: state.previewFile,
    previewContent: state.previewContent,
    previewLoading: state.previewLoading,
    fetchFileTree,
    toggleFolder,
    openPreview,
    closePreview,
    downloadFile,
    uploadFile,
  }
}

/**
 * Insert a file node into the tree at the correct path
 */
function insertFileIntoTree(
  tree: FileNode[],
  file: FileNode,
  originalPath: string
): FileNode[] {
  const normalizedPath = originalPath.replace(/^\/+/, '')
  const pathParts = normalizedPath.split('/').filter(Boolean)
  pathParts.pop() // Remove filename

  if (pathParts.length === 0) {
    // File is at root level
    // Check if file already exists
    const existingIndex = tree.findIndex(n => n.id === file.id)
    if (existingIndex >= 0) {
      tree[existingIndex] = file
    } else {
      tree.push(file)
    }
    return sortTree(tree)
  }

  // Need to find/create parent folder
  let currentLevel = tree
  let currentPath = ''

  for (const folderName of pathParts) {
    currentPath += '/' + folderName
    const folderId = `folder-${currentPath}`

    let folder = currentLevel.find(n => n.id === folderId)
    if (!folder) {
      folder = {
        id: folderId,
        name: folderName,
        type: 'folder',
        path: currentPath,
        children: [],
      }
      currentLevel.push(folder)
      sortTree(currentLevel)
    }
    if (!folder.children) {
      folder.children = []
    }
    currentLevel = folder.children
  }

  // Add file to the current level
  const existingIndex = currentLevel.findIndex(n => n.id === file.id)
  if (existingIndex >= 0) {
    currentLevel[existingIndex] = file
  } else {
    currentLevel.push(file)
  }
  sortTree(currentLevel)

  return tree
}

/**
 * Update file status in tree
 */
function updateFileStatus(
  tree: FileNode[],
  fileId: string,
  status: FileStatus
): FileNode[] {
  return tree.map(node => {
    if (node.type === 'file' && node.fileId === fileId) {
      return { ...node, status }
    }
    if (node.children) {
      return { ...node, children: updateFileStatus(node.children, fileId, status) }
    }
    return node
  })
}

/**
 * Sort tree: folders first, then files, alphabetically
 */
function sortTree(nodes: FileNode[]): FileNode[] {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
  return nodes
}
