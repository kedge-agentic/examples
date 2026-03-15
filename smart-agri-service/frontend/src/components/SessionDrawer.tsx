import React from 'react'
import { VIEW_MODE_TEMPLATES } from '../types'
import type { Conversation, ViewMode } from '../types'

interface SessionDrawerProps {
  open: boolean
  onClose: () => void
  conversations: Conversation[]
  loading: boolean
  viewMode: ViewMode
  activeSessionId?: string
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
}

function formatTime(isoStr: string) {
  const d = new Date(isoStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (isToday) return `今天 ${time}`
  if (isYesterday) return `昨天 ${time}`
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

function groupByDate(items: Conversation[]): Map<string, Conversation[]> {
  const groups = new Map<string, Conversation[]>()
  const now = new Date()

  for (const item of items) {
    const d = new Date(item.lastActivity)
    let label: string

    if (d.toDateString() === now.toDateString()) {
      label = '今天'
    } else {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (d.toDateString() === yesterday.toDateString()) {
        label = '昨天'
      } else {
        label = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
      }
    }

    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(item)
  }

  return groups
}

export function SessionDrawer({
  open,
  onClose,
  conversations,
  loading,
  viewMode,
  activeSessionId,
  onSelectSession,
  onNewSession,
}: SessionDrawerProps) {
  // Conversations are already sorted by lastActivity DESC from backend
  const groups = groupByDate(conversations)
  const isFarmer = viewMode === 'farmer'

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl rounded-r-2xl z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`h-14 flex items-center justify-between px-4 border-b rounded-tr-2xl ${
          isFarmer
            ? 'bg-agri-green-50 border-agri-green-200'
            : 'bg-bank-blue-50 border-bank-blue-200'
        }`}>
          <h2 className="font-semibold text-gray-800">历史对话</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
            aria-label="关闭历史面板"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-3 border-b">
          <button
            onClick={() => { onNewSession(); onClose(); }}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              isFarmer
                ? 'bg-agri-green-600 text-white hover:bg-agri-green-700'
                : 'bg-bank-blue-600 text-white hover:bg-bank-blue-700'
            }`}
          >
            + 新对话
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {loading && conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              加载中...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              暂无历史对话
            </div>
          ) : (
            Array.from(groups.entries()).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <div className="px-4 py-2 text-xs text-gray-400 font-medium bg-gray-50 sticky top-0">
                  {dateLabel}
                </div>
                {items.map(item => (
                  <button
                    key={item.sessionId}
                    onClick={() => { onSelectSession(item.sessionId); onClose(); }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                      activeSessionId === item.sessionId
                        ? isFarmer
                          ? 'bg-agri-green-50/50 border-l-2 border-l-agri-green-400'
                          : 'bg-bank-blue-50/50 border-l-2 border-l-bank-blue-400'
                        : isFarmer
                          ? 'hover:bg-agri-green-50/50'
                          : 'hover:bg-bank-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">
                        {item.templateName === VIEW_MODE_TEMPLATES.farmer ? '🧑‍🌾' : '🏦'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(item.lastActivity)}
                      </span>
                      <span className="text-xs text-gray-300 ml-auto">
                        {item.messageCount} 条消息
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      {item.title || '新对话'}
                    </p>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
