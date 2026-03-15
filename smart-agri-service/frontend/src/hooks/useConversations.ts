import { useState, useEffect, useCallback, useRef } from 'react'
import type { Conversation } from '../types'
import { SERVER_URL, TENANT_ID } from '../config'

export function useConversations(templateName: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchConversations = useCallback(async (tmpl: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const url = `${SERVER_URL}/api/v1/conversations?templateName=${encodeURIComponent(tmpl)}&limit=50`
      const res = await fetch(url, {
        headers: { 'x-tenant-id': TENANT_ID },
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      // Silent fail — conversations are a nice-to-have, not critical
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchConversations(templateName)
    return () => abortRef.current?.abort()
  }, [templateName, fetchConversations])

  const refresh = useCallback(() => {
    fetchConversations(templateName)
  }, [fetchConversations, templateName])

  return { conversations, loading, refresh }
}
