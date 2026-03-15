import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { ChatPanel } from './components/ChatPanel'
import { FarmerProfilePanel } from './components/FarmerProfilePanel'
import { CreditReportPanel } from './components/CreditReportPanel'
import { SessionDrawer } from './components/SessionDrawer'
import { DemoGuideModal } from './components/DemoGuideModal'
import { PolicyDocumentPage } from './pages/PolicyDocumentPage'
import { useAgriSession } from './hooks/useAgriSession'
import { useConversations } from './hooks/useConversations'
import { PolicyCacheProvider } from './hooks/usePolicyCache'
import { VIEW_MODE_TEMPLATES } from './types'
import type { ViewMode } from './types'

interface MainLayoutProps {
  viewMode: ViewMode
}

function MainLayout({ viewMode }: MainLayoutProps) {
  const { sessionId: activeSessionId } = useParams<{ sessionId?: string }>()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  const templateName = VIEW_MODE_TEMPLATES[viewMode]
  const { conversations, loading: conversationsLoading, refresh: refreshConversations } = useConversations(templateName)

  // Key forces ChatPanel and display panels to remount on session/view change
  const sessionKey = activeSessionId || `new-${viewMode}`
  const session = useAgriSession(viewMode, activeSessionId)

  // If URL has a sessionId but connection error occurred, redirect to new session
  useEffect(() => {
    if (activeSessionId && session.error) {
      navigate(`/${viewMode}`, { replace: true })
    }
  }, [activeSessionId, session.error, viewMode, navigate])

  // Refresh conversations list when a new session gets its first message
  const trackedRef = useRef<string | null>(null)
  useEffect(() => {
    if (session.sessionId && session.messages.length > 0 && trackedRef.current !== session.sessionId) {
      trackedRef.current = session.sessionId
      // Delay refresh to let backend persist the session
      const timer = setTimeout(() => refreshConversations(), 2000)
      return () => clearTimeout(timer)
    }
  }, [session.sessionId, session.messages.length, refreshConversations])

  // Periodically refresh conversations as messages accumulate
  const prevMsgCount = useRef(0)
  useEffect(() => {
    if (session.messages.length > prevMsgCount.current + 2) {
      prevMsgCount.current = session.messages.length
      refreshConversations()
    }
  }, [session.messages.length, refreshConversations])

  const handleViewChange = useCallback((mode: ViewMode) => {
    if (mode !== viewMode) {
      navigate(`/${mode}`)
    }
  }, [viewMode, navigate])

  const handleSelectSession = useCallback((sid: string) => {
    navigate(`/${viewMode}/session/${sid}`)
  }, [viewMode, navigate])

  const handleNewSession = useCallback(() => {
    navigate(`/${viewMode}`)
  }, [viewMode, navigate])

  const isFarmer = viewMode === 'farmer'

  return (
    <div className="h-screen flex flex-col">
      <Header
        viewMode={viewMode}
        onViewChange={handleViewChange}
        connected={session.connected}
        onOpenHistory={() => setDrawerOpen(true)}
        onOpenDemo={() => setDemoOpen(true)}
      />

      <DemoGuideModal open={demoOpen} onClose={() => setDemoOpen(false)} />

      <SessionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversations}
        loading={conversationsLoading}
        viewMode={viewMode}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
      />

      <div className="flex-1 flex overflow-hidden transition-colors duration-500 animate-fade-in" key={sessionKey}>
        {/* Chat Panel - 40% */}
        <div className="w-[40%] border-r border-gray-200 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.08)] flex flex-col">
          <ChatPanel
            messages={session.messages}
            isProcessing={session.isProcessing}
            currentStreamContent={session.currentStreamContent}
            onSendMessage={session.sendMessage}
            activeTools={session.activeTools}
            isThinking={session.isThinking}
            thinkingContent={session.thinkingContent}
            viewMode={viewMode}
          />
        </div>

        {/* Right Panel - 60% */}
        <div
          className={`w-[60%] transition-colors duration-500 animate-fade-in ${
            isFarmer
              ? 'bg-gradient-to-b from-agri-green-50/50 to-gray-50'
              : 'bg-gradient-to-b from-bank-blue-50/50 to-gray-50'
          }`}
          style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        >
          {isFarmer ? (
            <FarmerProfilePanel
              displayData={session.displayData}
              isProcessing={session.isProcessing}
            />
          ) : (
            <CreditReportPanel
              displayData={session.displayData}
              isProcessing={session.isProcessing}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <PolicyCacheProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/farmer" replace />} />
        <Route path="/farmer" element={<MainLayout viewMode="farmer" />} />
        <Route path="/farmer/session/:sessionId" element={<MainLayout viewMode="farmer" />} />
        <Route path="/bank" element={<MainLayout viewMode="bank" />} />
        <Route path="/bank/session/:sessionId" element={<MainLayout viewMode="bank" />} />
        <Route path="/policy/:id" element={<PolicyDocumentPage />} />
      </Routes>
    </PolicyCacheProvider>
  )
}

export default App
