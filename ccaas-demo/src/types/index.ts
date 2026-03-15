/**
 * CCAAS Demo Types
 */

export interface SkillHeader {
  whenToUse: string
  objective: string
  triggers: string[]
}

export interface Skill {
  id: string
  name: string
  slug?: string
  icon: string
  description: string
  enabled: boolean
  header?: SkillHeader
  content?: string                   // Full markdown content
  type?: 'skill' | 'sub-agent'
}

export interface TriggerInput {
  type: 'keyword' | 'intent' | 'pattern'
  value: string
  description?: string
}

export interface SkillFormData {
  name: string
  slug: string
  description: string
  content: string                    // Markdown content
  type: 'skill' | 'sub-agent'
  icon?: string
  whenToUse?: string
  triggers: string[]                 // Trigger keywords
}

export interface FileInfo {
  id?: string                    // Backend file ID (for download)
  name: string
  size: number | string          // Bytes (number) or "Calculating..." (string)
  type: string                   // MIME type or "unknown"
}

// Tool activity tracking
export interface ToolActivity {
  toolName: string
  toolId: string
  phase: 'start' | 'progress' | 'end'
  timestamp: Date
  duration?: number
  success?: boolean
  description?: string
  toolInput?: unknown
  toolOutput?: unknown
  toolError?: string
}

// Content block types for inline tool cards in chat
export interface TextBlock { type: 'text'; text: string }
export interface ToolBlock { type: 'tool'; tool: ToolActivity }
export type ContentBlock = TextBlock | ToolBlock

// File Browser Types
export type FileStatus = 'new' | 'modified' | 'synced'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
  fileId?: string
  mimeType?: string
  size?: number
  status?: FileStatus
  uploadedBy?: 'agent' | 'user'
  createdAt?: Date
}

export interface FilePreview {
  content: string
  truncated: boolean
  encoding: 'utf8' | 'base64'
  mimeType: string
  size: number
}

export interface FileCreatedEvent {
  type: 'file_created'
  payload: {
    id: string
    filename: string
    originalPath: string
    mimeType: string | null
    size: number
    status: FileStatus
    uploadedBy: 'agent' | 'user'
    createdAt: string
    sessionId: string
    messageId: string
  }
}

export interface TokenUsageInfo {
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  estimatedCostUsd: number
  model: string
  requestCount: number  // number of API calls in this message
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  skill?: string
  files?: FileInfo[]             // Changed from file?: FileInfo
  tools?: ToolActivity[]         // Track tool usage
  contentBlocks?: ContentBlock[] // Inline content blocks (text + tool cards)
  status?: 'sending' | 'streaming' | 'complete'
  tokenUsage?: TokenUsageInfo
  timestamp: Date
}

export interface SessionState {
  sessionId: string
  messages: Message[]
  activeSkill: string | null
  needsRestart: boolean
  isProcessing: boolean
}

// Todo tracking types
export interface TodoItem {
  id?: string
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  activeForm?: string
  progress?: number
}

export interface TodoStats {
  completed: number
  inProgress: number
  pending: number
  total: number
}

// ChatLayout removed - now using ChatLayoutMode from @kedge-agentic/react-sdk

export type ProtocolEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_activity'; tool: string; status: 'start' | 'end' }
  | { type: 'file_created'; file: FileInfo }
  | { type: 'skill_updated'; skillId: string; requiresRestart: boolean }
  | { type: 'agent_status'; status: 'idle' | 'running' | 'complete' | 'error' }

// Workspace File Explorer Types
export interface FileTreeNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  mimeType?: string
  children?: FileTreeNode[]
}

export interface WorkspaceTreeResponse {
  tree: FileTreeNode[]
}

export interface FileExplorerState {
  tree: FileTreeNode[]
  loading: boolean
  error: string | null
  expandedFolders: Set<string>
  searchQuery: string
  sortBy: 'name' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
}
