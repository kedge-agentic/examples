import { useState, useCallback } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
const API_KEY = import.meta.env.VITE_API_KEY

interface UseFileDownloadResult {
  downloadFile: (sessionId: string, filePath: string, filename: string) => Promise<void>
  downloading: Set<string>
}

/**
 * Hook to handle file downloads from workspace
 */
export function useFileDownload(): UseFileDownloadResult {
  const [downloading, setDownloading] = useState<Set<string>>(new Set())

  const downloadFile = useCallback(async (sessionId: string, filePath: string, filename: string) => {
    const key = `${sessionId}:${filePath}`
    setDownloading(prev => new Set(prev).add(key))

    try {
      const headers: HeadersInit = {}
      if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`
      }

      const url = `${BACKEND_URL}/api/v1/sessions/${sessionId}/workspace/${filePath}`

      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      // Create blob and download
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    } finally {
      setDownloading(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }, [])

  return { downloadFile, downloading }
}
