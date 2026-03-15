/**
 * Demo Session Hook - Combines SDK hooks with demo-specific features
 *
 * Uses @kedge-agentic/react-sdk hooks for core chat functionality,
 * adds demo-specific features:
 * - Skills CRUD operations
 * - File tracking and download
 * - Token usage tracking
 */

import { useState, useCallback, useEffect } from 'react'
import {
  useAgentConnection,
  useAgentChat,
  useAgentStatus,
  useChatLayout,
} from '@kedge-agentic/react-sdk'
import type { Skill, SkillFormData, FileInfo } from '../types'
import type { ToolActivityEvent } from '@kedge-agentic/common'

// Backend configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
const API_KEY = import.meta.env.VITE_API_KEY || ''
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'default'

/**
 * Derive MIME type from filename extension.
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeMap: Record<string, string> = {
    md: 'text/markdown',
    json: 'application/json',
    txt: 'text/plain',
    ts: 'text/typescript',
    tsx: 'text/typescript',
    js: 'text/javascript',
    jsx: 'text/javascript',
    html: 'text/html',
    css: 'text/css',
    yaml: 'text/yaml',
    yml: 'text/yaml',
    xml: 'application/xml',
    py: 'text/x-python',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
  }
  return mimeMap[ext || ''] || 'application/octet-stream'
}

// API helper
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
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

// Backend skill type
interface BackendSkill {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  content: string
  type: string
  config: Record<string, unknown>
  allowedTools: string[]
  triggers: Array<{
    type: string
    value: string
    priority?: number
    description?: string
  }>
  status: 'draft' | 'published' | 'archived'
  currentVersion: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

// Convert backend skill to frontend format
function convertSkill(backendSkill: BackendSkill): Skill {
  const header = {
    whenToUse:
      backendSkill.triggers
        .filter((t) => t.description)
        .map((t) => t.description)
        .join('; ') ||
      `When keywords match: ${backendSkill.triggers.map((t) => t.value).join(', ')}`,
    objective: backendSkill.description || 'No description provided',
    triggers: backendSkill.triggers.map((t) => t.value),
  }

  const icon =
    (backendSkill.config.icon as string) || (backendSkill.type === 'sub-agent' ? '🤖' : '⚡')

  return {
    id: backendSkill.id,
    name: backendSkill.name,
    slug: backendSkill.slug,
    icon,
    description: backendSkill.description || '',
    enabled: backendSkill.status === 'published',
    header,
    content: backendSkill.content,
    type: backendSkill.type as 'skill' | 'sub-agent',
  }
}

export function useDemoSession() {
  // Core SDK hooks
  const connection = useAgentConnection({
    serverUrl: BACKEND_URL,
    tenantId: TENANT_ID,
    transport: 'sse', // SSE is the default; explicit for clarity
  })

  const chat = useAgentChat({
    connection,
    tenantId: TENANT_ID,
  })

  const status = useAgentStatus({ connection })
  const layout = useChatLayout()

  // Demo-specific state
  const [filesInMessages, setFilesInMessages] = useState<Map<string, FileInfo[]>>(new Map())

  // Skills management with custom CRUD
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [skillsError, setSkillsError] = useState<string | null>(null)

  // Fetch skills from backend
  const fetchSkills = useCallback(async () => {
    try {
      setSkillsLoading(true)
      const response = await fetchAPI<{ items: BackendSkill[] }>('/api/v1/skills')
      const convertedSkills = response.items.map(convertSkill)
      setSkills(convertedSkills)
      setSkillsError(null)
    } catch (err) {
      console.error('Failed to fetch skills:', err)
      setSkillsError(`获取 skills 失败: ${err instanceof Error ? err.message : err}`)
    } finally {
      setSkillsLoading(false)
    }
  }, [])

  // Load skills on connection
  useEffect(() => {
    if (connection.connected) {
      fetchSkills()
    }
  }, [connection.connected, fetchSkills])

  // Track file creation from Write tool activity
  useEffect(() => {
    if (!connection.socket) return

    const onToolActivity = (data: ToolActivityEvent) => {
      const { payload } = data
      if (!payload) return

      // Extract file info for Write tool
      if (payload.toolName === 'Write' && payload.phase === 'end' && payload.toolInput) {
        const input = payload.toolInput as { file_path?: string }
        if (input.file_path) {
          const fileName = input.file_path.split('/').pop() || 'file'
          const newFile: FileInfo = {
            name: fileName,
            size: 'Calculating...',
            type: getMimeType(fileName),
          }

          // Add file to the current message's files
          setFilesInMessages((prev) => {
            const updated = new Map(prev)
            const currentFiles = updated.get(connection.sessionId) || []
            updated.set(connection.sessionId, [...currentFiles, newFile])
            return updated
          })
        }
      }
    }

    connection.socket.on('tool_activity', onToolActivity)
    return () => {
      connection.socket?.off('tool_activity', onToolActivity)
    }
  }, [connection.socket, connection.sessionId])

  // Fetch file sizes when processing completes
  useEffect(() => {
    if (!status.isProcessing && connection.sessionId) {
      const fetchFileSizes = async () => {
        try {
          const backendFiles = await fetchAPI<
            Array<{ id: string; filename: string; size: number; mimeType?: string }>
          >(`/api/v1/sessions/${connection.sessionId}/files`)

          if (backendFiles && backendFiles.length > 0) {
            setFilesInMessages((prev) => {
              const updated = new Map(prev)
              const currentFiles = updated.get(connection.sessionId) || []
              const updatedFiles = currentFiles.map((f) => {
                const backendFile = backendFiles.find((bf) => bf.filename === f.name)
                if (backendFile) {
                  return {
                    ...f,
                    id: backendFile.id,
                    size: backendFile.size,
                    type: backendFile.mimeType || f.type,
                  }
                }
                return f
              })
              updated.set(connection.sessionId, updatedFiles)
              return updated
            })
          }
        } catch (err) {
          console.log('Could not fetch file info:', err)
        }
      }

      fetchFileSizes()
    }
  }, [status.isProcessing, connection.sessionId])

  // Download file
  const downloadFile = useCallback(
    async (fileName: string) => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/v1/sessions/${connection.sessionId}/files/download?filename=${encodeURIComponent(fileName)}`,
          {
            headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
          }
        )

        if (!response.ok) throw new Error('Download failed')

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('Failed to download file:', err)
      }
    },
    [connection.sessionId]
  )

  // Skill CRUD operations
  const toggleSkill = useCallback(async (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId)
    if (!skill) return

    try {
      const newStatus = skill.enabled ? 'draft' : 'published'
      await fetchAPI(`/api/v1/skills/${skillId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })

      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, enabled: !s.enabled } : s))
      )
    } catch (err) {
      console.error('Failed to toggle skill:', err)
    }
  }, [skills])

  const createSkill = useCallback(async (data: SkillFormData) => {
    try {
      await fetchAPI('/api/v1/skills', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          description: data.description,
          content: data.content,
          type: data.type,
          config: { icon: data.icon },
          triggers: data.triggers.map((value) => ({
            type: 'keyword',
            value,
            description: data.whenToUse,
          })),
          status: 'published',
        }),
      })
      await fetchSkills()
    } catch (err) {
      console.error('Failed to create skill:', err)
      throw err
    }
  }, [fetchSkills])

  const updateSkill = useCallback(async (skillId: string, data: SkillFormData) => {
    try {
      await fetchAPI(`/api/v1/skills/${skillId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          description: data.description,
          content: data.content,
          type: data.type,
          config: { icon: data.icon },
          triggers: data.triggers.map((value) => ({
            type: 'keyword',
            value,
            description: data.whenToUse,
          })),
        }),
      })
      await fetchSkills()
    } catch (err) {
      console.error('Failed to update skill:', err)
      throw err
    }
  }, [fetchSkills])

  const deleteSkill = useCallback(async (skillId: string) => {
    try {
      await fetchAPI(`/api/v1/skills/${skillId}`, {
        method: 'DELETE',
      })
      await fetchSkills()
    } catch (err) {
      console.error('Failed to delete skill:', err)
      throw err
    }
  }, [fetchSkills])

  const getSkillDetails = useCallback(async (skillId: string): Promise<Skill> => {
    const response = await fetchAPI<BackendSkill>(`/api/v1/skills/${skillId}`)
    return convertSkill(response)
  }, [])

  // Start a new conversation (clears messages, generates new sessionId, reconnects)
  const newConversation = useCallback(() => {
    setFilesInMessages(new Map())
    chat.clearConversation()
  }, [chat])

  return {
    // Connection state
    connected: connection.connected,
    sessionId: connection.sessionId,
    socket: connection.socket,
    error: connection.error || skillsError,

    // Chat state from SDK
    messages: chat.messages,
    isProcessing: chat.isProcessing,
    isLoadingHistory: chat.isLoadingHistory,
    sendMessage: chat.sendMessage,
    clearMessages: chat.clearMessages,
    clearConversation: chat.clearConversation,
    cancelProcessing: chat.cancelProcessing,

    // Status from SDK
    activeTools: status.activeTools,
    isThinking: status.isThinking,
    thinkingContent: status.thinkingContent,
    todoItems: status.todoItems,
    todoStats: status.todoStats,
    activeSubAgents: status.activeSubAgents,

    // Layout from SDK
    layout,

    // Skills management
    skills,
    skillsLoading,
    toggleSkill,
    createSkill,
    updateSkill,
    deleteSkill,
    getSkillDetails,
    refreshSkills: fetchSkills,

    // Demo-specific features
    filesInMessages,
    downloadFile,
    newConversation,
  }
}
