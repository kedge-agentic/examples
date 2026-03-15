// ═══════════════════════════════════════════
// useMckinseySession — main session hook
//
// CRITICAL: serverUrl MUST be absolute URL to backend.
// Empty string '' or '/' causes SDK to use frontend port — see MEMORY.md
// ═══════════════════════════════════════════

import { computed } from 'vue'
import {
  useAgentConnection,
  useAgentChatSse,
  useAgentStatus,
  useFiles,
} from '@kedge-agentic/vue-sdk'

// CRITICAL: Absolute URL to CCAAS backend, not empty string
// See MEMORY.md: "serverUrl Configuration - Empty String Causes Wrong Backend"
const SERVER_URL = 'http://localhost:3001'

const TENANT_ID = 'mckinsey-cli'
const SKILL_SLUG = 'mckinsey-consultant'

export function useMckinseySession() {
  // ===== Connection =====
  const connection = useAgentConnection({
    serverUrl: SERVER_URL,
    tenantId: TENANT_ID,
    sessionPrefix: 'mckinsey',
    transport: 'sse',
    autoConnect: true,
  })

  // ===== Chat =====
  const chat = useAgentChatSse({
    connection,
    tenantId: TENANT_ID,
    enabledSkills: [SKILL_SLUG],
  })

  // ===== Status =====
  const status = useAgentStatus({ connection })

  // ===== Files =====
  const files = useFiles({
    connection,
    sessionId: connection.sessionId.value,
  })

  // Convenience: total file count
  const fileCount = computed(() => files.files.value.length)

  return {
    // Connection
    connection,
    connected: connection.connected,
    sessionId: connection.sessionId,
    error: connection.error,

    // Chat
    messages: chat.messages,
    isProcessing: chat.isProcessing,
    isLoadingHistory: chat.isLoadingHistory,
    currentStreamContent: chat.currentStreamContent,
    sendMessage: chat.sendMessage,
    clearConversation: chat.clearConversation,
    cancelProcessing: chat.cancelProcessing,

    // Status
    agentStatus: status.agentStatus,
    isThinking: status.isThinking,
    thinkingContent: status.thinkingContent,
    thinkingStartTime: status.thinkingStartTime,
    thinkingVerb: status.thinkingVerb,
    activeTools: status.activeTools,
    tokenUsage: status.tokenUsage,
    todoItems: status.todoItems,
    todoStats: status.todoStats,
    activeSubAgents: status.activeSubAgents,
    currentActivity: status.currentActivity,

    // Files
    files: files.files,
    filesLoading: files.isLoading,
    filesError: files.error,
    newFilesCount: files.newFilesCount,
    hasNewFiles: files.hasNewFiles,
    downloadFile: files.downloadFile,
    refetchFiles: files.refetch,
    fileCount,

    // New conversation
    startNewConversation: connection.startNewConversation,
  }
}
