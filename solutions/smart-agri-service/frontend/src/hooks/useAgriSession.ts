import { useState, useCallback, useEffect, useRef } from 'react'
import {
  useAgentConnection,
  useAgentChat,
} from '@kedge-agentic/react-sdk'
import type { ToolActivity } from '@kedge-agentic/react-sdk'
import type { SyncField, DisplayItem, ViewMode } from '../types'
import { SERVER_URL, TENANT_ID } from '../config'

export function useAgriSession(viewMode: ViewMode, targetSessionId?: string) {
  const [displayData, setDisplayData] = useState<Map<SyncField, DisplayItem>>(new Map())

  // ── Local tool & thinking state (SSE mode: useAgentStatus can't receive these) ──
  const [activeTools, setActiveTools] = useState<Map<string, ToolActivity>>(new Map())
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingContent, setThinkingContent] = useState('')

  const sessionTemplate = viewMode === 'farmer' ? 'farmer-advisor' : 'bank-assessor'

  const connection = useAgentConnection({
    serverUrl: SERVER_URL,
    tenantId: TENANT_ID,
    autoConnect: true,
    transport: 'sse',
    ...(targetSessionId
      ? { sessionId: targetSessionId }
      : { forceNewConversation: true }),
  })

  const chat = useAgentChat({
    connection,
    tenantId: TENANT_ID,
    sessionTemplate,
    transport: 'sse',
    onOutputUpdate: (update) => {
      setDisplayData(prev => {
        const next = new Map(prev)
        next.set(update.field as SyncField, {
          field: update.field as SyncField,
          value: update.value,
          preview: update.preview,
          timestamp: Date.now(),
        })
        return next
      })
    },
    onToolActivity: (activity) => {
      setActiveTools(prev => {
        const updated = new Map(prev)
        if (activity.phase === 'end') {
          updated.set(activity.toolId, { ...activity, endTime: Date.now() })
        } else {
          updated.set(activity.toolId, activity)
        }
        return updated
      })
    },
    onThinkingUpdate: (phase, content) => {
      if (phase === 'start') {
        setIsThinking(true)
        setThinkingContent('')
      } else if (phase === 'delta' && content) {
        setThinkingContent(prev => prev + content)
      } else if (phase === 'end') {
        setTimeout(() => setIsThinking(false), 3000)
      }
    },
  })

  // Cleanup ended tools after 2 seconds (mirrors useAgentStatus behavior)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTools(prev => {
        const updated = new Map(prev)
        const now = Date.now()
        for (const [toolId, tool] of updated.entries()) {
          if (tool.phase === 'end' && tool.endTime && (now - tool.endTime > 2000)) {
            updated.delete(toolId)
          }
        }
        return updated.size === prev.size ? prev : updated
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Reset thinking/tools on completion
  const prevProcessingRef = useRef(false)
  useEffect(() => {
    if (!chat.isProcessing && prevProcessingRef.current) {
      setIsThinking(false)
      setThinkingContent('')
      setActiveTools(new Map())
    }
    prevProcessingRef.current = chat.isProcessing
  }, [chat.isProcessing])

  // Restore displayData from persisted events when loading a history session
  useEffect(() => {
    if (!targetSessionId || !connection.connected) return

    fetch(`${SERVER_URL}/api/v1/sessions/${targetSessionId}/events?type=output_update&limit=200`)
      .then(r => r.json())
      .then(({ events }) => {
        if (!events?.length) return
        const restored = new Map<SyncField, DisplayItem>()
        for (const evt of events) {
          const p = (evt.payload as any)?.payload
          const data = p?.data
          if (data?.field) {
            restored.set(data.field as SyncField, {
              field: data.field as SyncField,
              value: data.value,
              preview: data.preview || `Update ${data.field}`,
              timestamp: new Date(evt.createdAt).getTime(),
            })
          }
        }
        if (restored.size > 0) {
          setDisplayData(restored)
        }
      })
      .catch(() => {})
  }, [targetSessionId, connection.connected])

  const clearSession = useCallback(() => {
    setDisplayData(new Map())
    chat.clearConversation()
  }, [chat])

  return {
    // Connection
    connected: connection.connected,
    sessionId: connection.sessionId,
    error: connection.error,

    // Chat
    messages: chat.messages,
    isProcessing: chat.isProcessing,
    currentStreamContent: chat.currentStreamContent,
    sendMessage: chat.sendMessage,
    clearConversation: chat.clearConversation,

    // Status (from SSE per-turn stream callbacks)
    activeTools,
    isThinking,
    thinkingContent,

    // Display data
    displayData,
    clearSession,
  }
}
