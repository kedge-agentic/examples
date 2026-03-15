/**
 * CCAAS Demo App
 *
 * Interactive demo showcasing Claude Code as a Service features:
 * - Real skills from backend API
 * - Real Claude Code CLI interactions
 * - File creation and download
 * - File browser with tree view
 * - Skill management (CRUD)
 */

import { useState, useCallback, useRef } from 'react'
import {
  ChatPanel,
  MessageBubble,
  ChatLayoutControls,
} from '@kedge-agentic/react-sdk'
import { SkillsSidebar } from './components/SkillsSidebar'
import { SkillEditor } from './components/SkillEditor'
import { ConfirmDialog } from './components/ConfirmDialog'
import { FileBrowserPanel } from './components/FileBrowserPanel'
import { FileExplorer } from './components/FileExplorer/FileExplorer'
import { useDemoSession } from './hooks/useDemoSession'
import { useFileBrowser } from './hooks/useFileBrowser'
import type { Skill, SkillFormData } from './types'

export default function App() {
  const demoSession = useDemoSession()
  const {
    skills,
    skillsLoading: loading,
    connected,
    error,
    sessionId,
    socket,
    messages,
    isProcessing,
    sendMessage,
    cancelProcessing,
    isLoadingHistory,
    activeTools,
    isThinking,
    thinkingContent,
    todoItems,
    todoStats,
    activeSubAgents,
    layout,
    toggleSkill,
    newConversation,
    downloadFile,
    refreshSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    getSkillDetails,
    filesInMessages,
  } = demoSession

  // File browser hook
  const fileBrowser = useFileBrowser({
    sessionId,
    socket,
  })

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Chat layout mode + resizable width (migrated to SDK useChatLayout)
  const DEFAULT_CHAT_WIDTH = 384 // w-96
  const MIN_CHAT_WIDTH = 384
  const MAX_CHAT_WIDTH = 800
  const [chatWidth, setChatWidth] = useState(600)
  const [isDragging, setIsDragging] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // File browser state
  const [fileBrowserCollapsed, setFileBrowserCollapsed] = useState(false)
  const [uploading, setUploading] = useState(false)

  // File explorer state
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false)

  // Handle file upload
  const handleUploadFiles = useCallback(async (files: File[]) => {
    setUploading(true)
    try {
      for (const file of files) {
        await fileBrowser.uploadFile(file)
      }
    } catch (err) {
      console.error('Failed to upload files:', err)
    } finally {
      setUploading(false)
    }
  }, [fileBrowser])

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [editingSkillContent, setEditingSkillContent] = useState<string>('')

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null)

  // Handle add skill
  const handleAddSkill = useCallback(() => {
    setEditingSkill(null)
    setEditingSkillContent('')
    setEditorOpen(true)
  }, [])

  // Handle edit skill
  const handleEditSkill = useCallback(async (skill: Skill) => {
    try {
      // Fetch full skill details including content
      const fullSkill = await getSkillDetails(skill.id)
      setEditingSkill(fullSkill)
      setEditingSkillContent(fullSkill.content || '')
      setEditorOpen(true)
    } catch (err) {
      console.error('Failed to fetch skill details:', err)
      // Fallback: use the skill data we already have
      setEditingSkill(skill)
      setEditingSkillContent(skill.content || '')
      setEditorOpen(true)
    }
  }, [getSkillDetails])

  // Handle save skill
  const handleSaveSkill = useCallback(async (data: SkillFormData) => {
    if (editingSkill) {
      await updateSkill(editingSkill.id, data)
    } else {
      await createSkill(data)
    }
  }, [editingSkill, createSkill, updateSkill])

  // Handle delete skill
  const handleDeleteClick = useCallback((skill: Skill) => {
    setSkillToDelete(skill)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (skillToDelete) {
      try {
        await deleteSkill(skillToDelete.id)
      } catch (err) {
        console.error('Failed to delete skill:', err)
      }
      setSkillToDelete(null)
    }
  }, [skillToDelete, deleteSkill])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CCAAS Demo</h1>
            <p className="text-sm text-gray-500">Claude Code as a Service</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-500">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* File Explorer Toggle */}
          <button
            onClick={() => setFileExplorerOpen(!fileExplorerOpen)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              fileExplorerOpen
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={fileExplorerOpen ? 'Close Workspace Files' : 'Open Workspace Files'}
          >
            📁 Workspace Files
          </button>

          {/* Refresh Skills Button */}
          <button
            onClick={refreshSkills}
            disabled={loading}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '加载中...' : '🔄 刷新 Skills'}
          </button>

          {/* New Conversation Button */}
          <button
            onClick={newConversation}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Start a new conversation"
          >
            + New Conversation
          </button>

          {/* Session ID */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Session:</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {sessionId.slice(0, 16)}...
            </code>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-3">
          <span className="text-red-500">⚠️</span>
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            重新加载
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && skills.length === 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center gap-3">
          <span className="animate-spin">⏳</span>
          <span className="text-blue-700">正在从后端加载 Skills...</span>
        </div>
      )}

      {/* No Skills Warning */}
      {!loading && skills.length === 0 && connected && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
          <span className="text-amber-500">💡</span>
          <span className="text-amber-700">
            没有找到 Skills。点击侧边栏的 "+" 按钮创建新的 Skill。
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Skills Sidebar */}
        <SkillsSidebar
          skills={skills}
          needsRestart={false}
          collapsed={sidebarCollapsed}
          onToggle={toggleSkill}
          onRestart={newConversation}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onAddSkill={handleAddSkill}
          onEditSkill={handleEditSkill}
          onDeleteSkill={handleDeleteClick}
        />

        {/* Main area (flex-1) + Chat Panel (resizable) */}
        <div className="flex-1 flex min-w-0 relative">
          {/* Functional area placeholder — currently empty, flex-1 takes remaining space */}
          <div className="flex-1 min-w-0 relative">
            {/* File Explorer Modal Overlay */}
            {fileExplorerOpen && (
              <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
                <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-100">Workspace Files</h2>
                    <button
                      onClick={() => setFileExplorerOpen(false)}
                      className="p-2 hover:bg-slate-800 rounded-md transition-colors"
                      aria-label="Close file explorer"
                    >
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* File Explorer */}
                  <div className="flex-1 overflow-hidden">
                    <FileExplorer
                      sessionId={sessionId}
                      onFileSelect={(file) => {
                        console.log('File selected:', file)
                        // Optional: close modal after file download
                        // setFileExplorerOpen(false)
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel with layout modes */}
          <div
            ref={chatContainerRef}
            className={[
              'flex flex-col border-l border-gray-200 bg-white',
              layout.mode === 'overlay'
                ? 'absolute right-0 top-0 bottom-0 z-10 shadow-xl'
                : 'shrink-0',
              !isDragging && 'transition-[width] duration-300 ease-in-out',
            ].filter(Boolean).join(' ')}
            style={{
              width: layout.mode === 'default' ? DEFAULT_CHAT_WIDTH : chatWidth,
            }}
          >
            {/* Resize handle on left edge (overlay/side-by-side only) */}
            {layout.mode !== 'default' && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-blue-400 active:bg-blue-500 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault()
                  const startX = e.clientX
                  const startWidth = chatWidth
                  setIsDragging(true)

                  const onMouseMove = (ev: MouseEvent) => {
                    const delta = startX - ev.clientX
                    const newWidth = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, startWidth + delta))
                    setChatWidth(newWidth)
                  }
                  const onMouseUp = () => {
                    setIsDragging(false)
                    document.removeEventListener('mousemove', onMouseMove)
                    document.removeEventListener('mouseup', onMouseUp)
                    document.body.style.cursor = ''
                    document.body.style.userSelect = ''
                  }
                  document.body.style.cursor = 'col-resize'
                  document.body.style.userSelect = 'none'
                  document.addEventListener('mousemove', onMouseMove)
                  document.addEventListener('mouseup', onMouseUp)
                }}
              />
            )}

            {/* Header with layout controls */}
            <div className="px-4 py-2 border-b flex items-center justify-between bg-white">
              <h2 className="font-medium text-gray-700">对话</h2>
              <ChatLayoutControls
                mode={layout.mode}
                onModeChange={layout.setMode}
                isCollapsed={layout.isCollapsed}
                onToggleCollapse={() => layout.setCollapsed(!layout.isCollapsed)}
                colorScheme="blue"
              />
            </div>

            {/* Loading history indicator */}
            {isLoadingHistory && (
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-sm text-blue-700">
                <span className="animate-spin">&#8635;</span>
                Loading conversation history...
              </div>
            )}

            <ChatPanel
              messages={messages}
              isProcessing={isProcessing}
              connected={connected}
              activeTools={activeTools}
              isThinking={isThinking}
              thinkingContent={thinkingContent}
              todoItems={todoItems}
              todoStats={todoStats}
              activeSubAgents={activeSubAgents}
              onSendMessage={sendMessage}
              onCancel={cancelProcessing}
              renderMessage={(msg) => (
                <MessageBubble message={msg} colorScheme="blue">
                  {/* Render file attachments */}
                  {filesInMessages.get(sessionId)?.map((file, idx) => (
                    <div key={idx} className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <button
                        onClick={() => downloadFile(file.name)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        📎 {file.name} ({file.size})
                      </button>
                    </div>
                  ))}
                </MessageBubble>
              )}
            />
          </div>
        </div>

        {/* File Browser Panel */}
        <FileBrowserPanel
          tree={fileBrowser.tree}
          expandedFolders={fileBrowser.expandedFolders}
          loading={fileBrowser.loading}
          error={fileBrowser.error}
          previewFile={fileBrowser.previewFile}
          previewContent={fileBrowser.previewContent}
          previewLoading={fileBrowser.previewLoading}
          collapsed={fileBrowserCollapsed}
          uploading={uploading}
          onToggleCollapse={() => setFileBrowserCollapsed(!fileBrowserCollapsed)}
          onToggleFolder={fileBrowser.toggleFolder}
          onPreviewFile={fileBrowser.openPreview}
          onClosePreview={fileBrowser.closePreview}
          onDownloadFile={fileBrowser.downloadFile}
          onRefresh={fileBrowser.fetchFileTree}
          onUploadFiles={handleUploadFiles}
        />
      </div>

      {/* Skill Editor Modal */}
      <SkillEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveSkill}
        skill={editingSkill}
        initialContent={editingSkillContent}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Skill"
        message={`Are you sure you want to delete "${skillToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  )
}
