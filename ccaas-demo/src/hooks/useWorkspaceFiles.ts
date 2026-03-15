import { useState, useEffect, useCallback } from 'react'
import type { FileTreeNode, WorkspaceTreeResponse } from '../types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
const API_KEY = import.meta.env.VITE_API_KEY

interface UseWorkspaceFilesResult {
  tree: FileTreeNode[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage workspace file tree from backend REST API
 */
export function useWorkspaceFiles(sessionId: string): UseWorkspaceFilesResult {
  const [tree, setTree] = useState<FileTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTree = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const headers: HeadersInit = {}
      if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`
      }

      const response = await fetch(
        `${BACKEND_URL}/api/v1/sessions/${sessionId}/workspace`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`)
      }

      const data: WorkspaceTreeResponse = await response.json()
      setTree(data.tree || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Failed to fetch workspace files:', err)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

  return { tree, loading, error, refetch: fetchTree }
}
