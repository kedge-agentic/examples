/**
 * Tool Activity Item Component
 *
 * Displays a single tool activity as a compact badge/pill or inline card.
 */

import type { ToolActivity } from '../types'

const TOOL_ICONS: Record<string, string> = {
  Read: '📖',
  Write: '✍️',
  Edit: '✏️',
  Bash: '💻',
  Glob: '🔍',
  Grep: '🔎',
  Task: '📋',
  WebFetch: '🌐',
  WebSearch: '🔍',
  AskUserQuestion: '❓',
  NotebookEdit: '📓',
}

/**
 * Extract a human-readable summary from tool input.
 * Falls back to description, then empty string.
 */
function getToolSummary(tool: ToolActivity): string {
  // Prefer backend-provided description
  if (tool.description) return tool.description

  const input = tool.toolInput as Record<string, unknown> | undefined
  if (!input) return ''

  const name = tool.toolName
  if (name === 'Read' || name === 'Write') {
    const p = (input.file_path as string) || ''
    return p ? shortenPath(p) : ''
  }
  if (name === 'Edit') {
    const p = (input.file_path as string) || ''
    return p ? shortenPath(p) : ''
  }
  if (name === 'Bash') {
    const cmd = (input.command as string) || ''
    return cmd.length > 60 ? cmd.slice(0, 57) + '...' : cmd
  }
  if (name === 'Glob') {
    return (input.pattern as string) || ''
  }
  if (name === 'Grep') {
    return (input.pattern as string) || ''
  }
  if (name === 'WebFetch' || name === 'WebSearch') {
    return (input.url as string) || (input.query as string) || ''
  }
  if (name === 'Task') {
    return (input.description as string) || ''
  }
  return ''
}

/** Shorten a file path to at most the last 2 segments. */
function shortenPath(p: string): string {
  const parts = p.split('/')
  if (parts.length <= 2) return p
  return '.../' + parts.slice(-2).join('/')
}

interface ToolActivityItemProps {
  tool: ToolActivity
  inline?: boolean
}

export function ToolActivityItem({ tool, inline }: ToolActivityItemProps) {
  const icon = TOOL_ICONS[tool.toolName] || '🔧'
  const statusIcon = tool.phase === 'start'
    ? '⏳'
    : tool.success !== false
      ? '✅'
      : '❌'

  // Format duration if available
  const durationText = tool.duration
    ? tool.duration > 1000
      ? `${(tool.duration / 1000).toFixed(1)}s`
      : `${tool.duration}ms`
    : null

  const summary = getToolSummary(tool)

  if (inline) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 my-1 text-xs bg-white/80 border border-gray-200 rounded-md text-gray-600"
        title={tool.toolError || `${tool.toolName} ${tool.phase}`}
      >
        <span>{icon}</span>
        <span className="font-medium text-gray-700">{tool.toolName}</span>
        {summary && (
          <span className="text-gray-500 truncate max-w-[200px]">{summary}</span>
        )}
        {tool.phase === 'start' ? (
          <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>{statusIcon}</span>
        )}
        {durationText && (
          <span className="text-gray-400">{durationText}</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full"
      title={tool.toolError || `${tool.toolName} ${tool.phase}`}
    >
      <span>{icon}</span>
      <span className="font-medium">{tool.toolName}</span>
      {summary && (
        <span className="text-gray-500 truncate max-w-[150px]">{summary}</span>
      )}
      <span>{statusIcon}</span>
      {durationText && (
        <span className="text-gray-500">{durationText}</span>
      )}
    </div>
  )
}
