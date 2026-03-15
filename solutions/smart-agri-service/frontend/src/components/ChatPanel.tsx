import React, { useState, useRef, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message, ToolActivity } from '@kedge-agentic/react-sdk'
import { PhoneInput } from './PhoneInput'
import type {
  ViewMode,
  ToolTimelineEntry,
  ConsumerStage,
  CreatorToolConfig,
} from '../types'
import { CONSUMER_STAGES, BANK_TOOL_SEQUENCE } from '../types'
import { policyMarkdownComponents } from '../utils/markdownComponents'

interface ChatPanelProps {
  messages: Message[]
  isProcessing: boolean
  currentStreamContent: string
  onSendMessage: (msg: string) => void
  activeTools: Map<string, ToolActivity>
  isThinking: boolean
  thinkingContent: string
  viewMode: ViewMode
}

/** Strip MCP server prefix from tool names */
function normalizeToolName(name: string) {
  // MCP tool format: mcp__{serverName}__{toolName}
  // Server names can contain underscores, so split on double-underscore separator
  const parts = name.split('__')
  if (parts.length >= 3 && parts[0] === 'mcp') {
    return parts.slice(2).join('__')
  }
  return name
}

/** Determine a consumer stage's display status */
function getStageStatus(
  stage: ConsumerStage,
  seenTools: Set<string>,
  activeToolNames: Set<string>,
): 'completed' | 'active' | 'pending' {
  if (stage.tools.some(t => activeToolNames.has(t))) return 'active'
  if (stage.tools.some(t => seenTools.has(t))) return 'completed'
  return 'pending'
}

export function ChatPanel({
  messages,
  isProcessing,
  currentStreamContent,
  onSendMessage,
  activeTools,
  isThinking,
  thinkingContent,
  viewMode,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Tool timeline tracking (persists across activeTools 2s cleanup) ──
  const toolTimelineRef = useRef<Map<string, ToolTimelineEntry>>(new Map())
  const [toolTimeline, setToolTimeline] = useState<ToolTimelineEntry[]>([])

  // Reset timeline when viewMode changes (session cleared)
  useEffect(() => {
    toolTimelineRef.current.clear()
    setToolTimeline([])
  }, [viewMode])

  // Reset timeline when a new processing round starts
  const prevIsProcessingRef = useRef(false)
  useEffect(() => {
    if (isProcessing && !prevIsProcessingRef.current) {
      toolTimelineRef.current.clear()
      setToolTimeline([])
    }
    prevIsProcessingRef.current = isProcessing
  }, [isProcessing])

  // Accumulate tool events into persistent timeline
  useEffect(() => {
    let changed = false
    for (const [toolId, tool] of activeTools.entries()) {
      const name = normalizeToolName(tool.toolName || '')
      const existing = toolTimelineRef.current.get(toolId)

      if (!existing) {
        toolTimelineRef.current.set(toolId, {
          toolId,
          name,
          startTime: tool.timestamp.getTime(),
          endTime: tool.endTime,
          phase: tool.phase,
          turnId: tool.turnId,
        })
        changed = true
      } else if (tool.phase !== existing.phase || (tool.endTime && !existing.endTime)) {
        toolTimelineRef.current.set(toolId, {
          ...existing,
          phase: tool.phase,
          endTime: tool.endTime || existing.endTime,
        })
        changed = true
      }
    }
    if (changed) {
      setToolTimeline(Array.from(toolTimelineRef.current.values()))
    }
  }, [activeTools])

  // Derived sets for stage computation
  const seenTools = useMemo(
    () => new Set(toolTimeline.map(t => t.name)),
    [toolTimeline],
  )

  const activeToolNames = useMemo(() => {
    const names = new Set<string>()
    for (const tool of activeTools.values()) {
      if (tool.phase !== 'end') {
        names.add(normalizeToolName(tool.toolName || ''))
      }
    }
    return names
  }, [activeTools])

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentStreamContent, toolTimeline])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handlePhoneSubmit = (phone: string) => {
    onSendMessage(phone)
  }

  // Show progress/tool chain when tools have been observed
  const showProgress = seenTools.size > 0 || activeTools.size > 0

  return (
    <div className="flex flex-col h-full">
      {/* Phone Input */}
      <PhoneInput onSubmit={handlePhoneSubmit} viewMode={viewMode} disabled={isProcessing} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-4xl mb-4">{viewMode === 'farmer' ? '🌾' : '🏦'}</p>
            <p className="text-sm">
              {viewMode === 'farmer'
                ? '输入农户手机号，AI将自动分析并提供服务建议'
                : '输入农户手机号，AI将生成专业信贷评估报告'}
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          // Skip empty assistant messages (streaming placeholder before content arrives)
          if (msg.role === 'assistant' && !msg.content) return null

          return (
            <div
              key={msg.id}
              className={`flex animate-slide-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: 'both' }}
            >
              <div
                className={`max-w-[85%] px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? viewMode === 'farmer'
                      ? 'bg-agri-green-600 text-white rounded-2xl rounded-br-sm'
                      : 'bg-bank-blue-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={policyMarkdownComponents}>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* NOTE: Do NOT render currentStreamContent separately here.
            The SDK syncs streaming text into messages[last].content in real-time,
            so the messages.map() loop above already displays it. Rendering both
            would cause duplicate messages. */}

        {/* ── Consumer mode: Friendly progress pipeline (farmer) ── */}
        {showProgress && viewMode === 'farmer' && (
          <ConsumerProgressView
            stages={CONSUMER_STAGES}
            seenTools={seenTools}
            activeToolNames={activeToolNames}
            isProcessing={isProcessing}
            isThinking={isThinking}
          />
        )}

        {/* ── Creator mode: Detailed tool chain (bank) ── */}
        {showProgress && viewMode === 'bank' && (
          <CreatorToolChainView
            toolSequence={BANK_TOOL_SEQUENCE}
            toolTimeline={toolTimeline}
            activeToolNames={activeToolNames}
            seenTools={seenTools}
            isProcessing={isProcessing}
            isThinking={isThinking}
          />
        )}

        {/* Thinking indicator (before first tool appears) */}
        {isThinking && !showProgress && (
          <div className={`inline-flex items-center gap-2 rounded-full shadow-sm px-4 py-2 text-xs ${
            viewMode === 'farmer'
              ? 'text-agri-green-600 bg-agri-green-50'
              : 'text-bank-blue-600 bg-bank-blue-50'
          }`}>
            <div className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${
              viewMode === 'farmer' ? 'border-agri-green-500' : 'border-bank-blue-500'
            }`} />
            <span>{viewMode === 'farmer' ? '正在准备为您服务...' : '正在初始化评估流程...'}</span>
          </div>
        )}

        {/* Connecting indicator (after send, before thinking/tools) */}
        {isProcessing && !isThinking && !showProgress && (
          <div className={`inline-flex items-center gap-2 rounded-full shadow-sm px-4 py-2 text-xs animate-fade-in ${
            viewMode === 'farmer'
              ? 'text-agri-green-600 bg-agri-green-50'
              : 'text-bank-blue-600 bg-bank-blue-50'
          }`}>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>{viewMode === 'farmer' ? '正在连接...' : '正在连接服务...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={viewMode === 'farmer' ? '有什么想了解的？' : '请输入您的问题...'}
            className={`flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-opacity duration-200 ${
              viewMode === 'farmer' ? 'focus:ring-agri-green-500' : 'focus:ring-bank-blue-500'
            } ${isProcessing ? 'opacity-60' : ''}`}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            rows={1}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm hover:shadow-md transition-all ${
              viewMode === 'farmer'
                ? 'bg-agri-green-600 hover:bg-agri-green-700 disabled:bg-gray-300'
                : 'bg-bank-blue-600 hover:bg-bank-blue-700 disabled:bg-gray-300'
            } disabled:cursor-not-allowed disabled:shadow-none`}
          >
            发送
          </button>
        </div>
      </form>
    </div>
  )
}

// ============================================================================
// Consumer Progress View (Farmer mode)
// Warm, friendly progress pipeline - hides technical details
// ============================================================================

function ConsumerProgressView({
  stages,
  seenTools,
  activeToolNames,
  isProcessing,
  isThinking,
}: {
  stages: ConsumerStage[]
  seenTools: Set<string>
  activeToolNames: Set<string>
  isProcessing: boolean
  isThinking: boolean
}) {
  return (
    <div className="bg-gradient-to-br from-agri-green-50 to-white rounded-xl p-3 space-y-2.5 shadow-card animate-slide-in">
      {stages.map((stage, idx) => {
        const status = getStageStatus(stage, seenTools, activeToolNames)
        return (
          <div key={idx} className="flex items-center gap-2.5 text-sm transition-colors duration-300">
            {/* Status indicator */}
            {status === 'completed' && (
              <span className="text-agri-green-600 w-5 text-center shrink-0">✅</span>
            )}
            {status === 'active' && (
              <div className="w-5 flex justify-center shrink-0">
                <div className="w-3.5 h-3.5 border-2 border-agri-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {status === 'pending' && (
              <span className="text-gray-300 w-5 text-center shrink-0">○</span>
            )}

            {/* Stage label with emotional tone per status */}
            <span className={
              status === 'completed' ? 'text-agri-green-700' :
              status === 'active' ? 'text-agri-green-600 font-medium' :
              'text-gray-400'
            }>
              {status === 'completed' ? stage.completedLabel :
               status === 'active' ? stage.activeLabel :
               stage.pendingLabel}
            </span>
          </div>
        )
      })}

      {/* Warm encouragement while processing */}
      {isProcessing && (
        <div className="mt-1 pt-2 border-t border-agri-green-100 text-xs text-agri-green-500">
          💬 请稍等，正在为您整理信息...
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Creator Tool Chain View (Bank mode)
// Professional, data-source-aware tool execution timeline
// ============================================================================

function CreatorToolChainView({
  toolSequence,
  toolTimeline,
  activeToolNames,
  seenTools,
  isProcessing,
  isThinking,
}: {
  toolSequence: CreatorToolConfig[]
  toolTimeline: ToolTimelineEntry[]
  activeToolNames: Set<string>
  seenTools: Set<string>
  isProcessing: boolean
  isThinking: boolean
}) {
  /** Get formatted duration for a completed tool */
  const getToolDuration = (toolName: string): string | null => {
    const entries = toolTimeline.filter(t => t.name === toolName && t.endTime)
    if (entries.length === 0) return null
    // Use the latest completed entry
    const last = entries[entries.length - 1]
    const ms = last.endTime! - last.startTime
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
  }

  /** Get tool execution status */
  const getToolStatus = (toolName: string): 'completed' | 'running' | 'pending' => {
    if (activeToolNames.has(toolName)) return 'running'
    if (seenTools.has(toolName)) return 'completed'
    return 'pending'
  }

  // Count completed write_output calls for display
  const writeOutputCount = toolTimeline.filter(
    t => t.name === 'write_output' && t.endTime,
  ).length

  // Collect data sources from completed tools
  const completedSources = toolSequence
    .filter(t => t.dataSource && seenTools.has(t.name))
    .map(t => t.dataSource!)

  return (
    <div className="bg-gradient-to-br from-bank-blue-50 to-white rounded-xl p-3 space-y-1 shadow-card animate-slide-in">
      {/* Header */}
      <div className="text-xs font-medium text-bank-blue-700 mb-2 flex items-center gap-1">
        🔧 工具链追踪
      </div>

      {/* Tool sequence */}
      {toolSequence.map((tool, idx) => {
        const status = getToolStatus(tool.name)
        const duration = getToolDuration(tool.name)
        const isLast = idx === toolSequence.length - 1

        return (
          <div key={tool.name} className="flex items-center gap-2 text-xs font-mono leading-5 transition-colors duration-300">
            {/* Vertical connector line */}
            <div className={`w-3 flex justify-center shrink-0 ${
              isLast ? '' : 'border-l-2 border-bank-blue-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                status === 'completed' ? 'bg-bank-blue-500' :
                status === 'running' ? 'bg-bank-blue-400' :
                'bg-gray-300'
              }`} />
            </div>

            {/* Status icon */}
            {status === 'completed' && (
              <span className="text-bank-blue-600 w-4 text-center shrink-0">✓</span>
            )}
            {status === 'running' && (
              <div className="w-4 flex justify-center shrink-0">
                <div className="w-3 h-3 border-2 border-bank-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {status === 'pending' && (
              <span className="text-gray-300 w-4 text-center shrink-0">·</span>
            )}

            {/* Tool label */}
            <span className={`flex-1 truncate ${
              status === 'completed' ? 'text-bank-blue-700' :
              status === 'running' ? 'text-bank-blue-600 font-semibold' :
              'text-gray-400'
            }`}>
              {tool.label}
              {tool.name === 'write_output' && writeOutputCount > 0 && (
                <span className="text-bank-blue-400 font-normal ml-1">
                  ×{writeOutputCount}
                </span>
              )}
            </span>

            {/* Data source badge (only for completed/running tools) */}
            {status !== 'pending' && tool.dataSource && (
              <span className="text-bank-blue-400 text-[10px] shrink-0 hidden sm:inline">
                {tool.dataSource}
              </span>
            )}

            {/* Duration / status text */}
            {status === 'completed' && duration && (
              <span className="text-bank-blue-400 tabular-nums shrink-0 w-12 text-right">
                {duration}
              </span>
            )}
            {status === 'running' && (
              <span className="text-bank-blue-400 shrink-0 w-12 text-right">进行中</span>
            )}
            {status === 'pending' && (
              <span className="text-gray-300 shrink-0 w-12 text-right">待执行</span>
            )}
          </div>
        )
      })}

      {/* Data source summary */}
      {completedSources.length > 0 && (
        <div className="mt-2 pt-2 border-t border-bank-blue-100 text-[10px] text-bank-blue-400">
          📊 数据源: {completedSources.join(', ')}
        </div>
      )}

      {/* Thinking indicator for bank mode */}
      {isThinking && (
        <div className="mt-1 pt-2 border-t border-bank-blue-100 flex items-center gap-2 text-xs text-bank-blue-500">
          <div className="w-3 h-3 border-2 border-bank-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>正在分析数据生成评估报告...</span>
        </div>
      )}
    </div>
  )
}
