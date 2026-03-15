import React, { useState, useEffect, useCallback } from 'react';
import { useProblemSession } from './hooks/useProblemSession';
import { useExplanationSync } from './hooks/useExplanationSync';
import { ProblemInput } from './components/ProblemInput/ProblemInput';
import { ExplanationPanel } from './components/ExplanationPanel/ExplanationPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { QuickActions } from './components/QuickActions/QuickActions';
import { Explanation, Subject, OutputUpdate, SyncField } from './types';
import { fetchSubjects, getOrCreateExplanation } from './utils/api';

const App: React.FC = () => {
  // State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('math');
  const [selectedGrade, setSelectedGrade] = useState<string>('9');
  const [problemContent, setProblemContent] = useState<string>('');
  const [problemImageUrl, setProblemImageUrl] = useState<string>('');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [problemId, setProblemId] = useState<string | null>(null);

  // Hooks
  const {
    messages,
    isConnected,
    isThinking,
    error: sessionError,
    sendMessage,
    sessionId,
    pendingUpdates: sessionPendingUpdates,
  } = useProblemSession({
    tenantId: 'problem-explainer',
    enabledSkills: ['problem-explainer'],
  });

  const {
    pendingUpdates,
    modifiedFields,
    addPendingUpdate,
    syncToForm,
    discardUpdate,
    undoSync,
    canUndo,
  } = useExplanationSync({
    explanationId: explanation?.id,
    onUpdate: (updates) => {
      setExplanation((prev) => (prev ? { ...prev, ...updates } : null));
    },
  });

  // Merge session pending updates into sync hook
  useEffect(() => {
    sessionPendingUpdates.forEach((update, field) => {
      addPendingUpdate(update);
    });
  }, [sessionPendingUpdates, addPendingUpdate]);

  // Load subjects
  useEffect(() => {
    fetchSubjects()
      .then(setSubjects)
      .catch((err) => console.error('Failed to load subjects:', err));
  }, []);

  // Handle sync
  const handleSync = useCallback(
    async (field: SyncField) => {
      const currentValue = explanation?.[field as keyof Explanation];
      await syncToForm(field, currentValue);
    },
    [explanation, syncToForm]
  );

  // Handle quick action
  const handleQuickAction = useCallback(
    (action: string) => {
      let prompt = '';
      switch (action) {
        case 'start':
          prompt = problemContent
            ? '请讲解这道题：\n\n' + problemContent
            : '请开始讲解';
          break;
        case 'next':
          prompt = '请继续讲解下一步';
          break;
        case 'detail':
          prompt = '请更详细地解释这一步';
          break;
        case 'practice':
          prompt = '请给我一道类似的变式练习题';
          break;
        default:
          return;
      }
      sendMessage(prompt);
    },
    [problemContent, sendMessage]
  );

  // Handle send message
  const handleSendMessage = useCallback(
    (content: string) => {
      // If problem content exists and this is about explaining, include it
      if (problemContent && !messages.length) {
        sendMessage('题目：\n' + problemContent + '\n\n' + content);
      } else {
        sendMessage(content);
      }
    },
    [problemContent, messages.length, sendMessage]
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800">讲题专家</h1>
          <div className="flex items-center space-x-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {['7', '8', '9', '10', '11', '12'].map((g) => (
                <option key={g} value={g}>
                  {g}年级
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={'w-2 h-2 rounded-full ' + (isConnected ? 'bg-green-500' : 'bg-red-500')}
          />
          <span className="text-sm text-gray-500">
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Input */}
        <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
          <ProblemInput
            content={problemContent}
            imageUrl={problemImageUrl}
            subject={selectedSubject}
            gradeLevel={selectedGrade}
            onContentChange={setProblemContent}
            onImageChange={setProblemImageUrl}
            sessionId={sessionId}
          />
        </div>

        {/* Center Panel - Explanation */}
        <div className="flex-1 overflow-auto p-4">
          <ExplanationPanel
            explanation={explanation}
            pendingUpdates={pendingUpdates}
            modifiedFields={modifiedFields}
            onSync={handleSync}
            onDiscard={discardUpdate}
            onUndo={undoSync}
            canUndo={canUndo}
          />
        </div>

        {/* Right Panel - Chat */}
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          <ChatPanel
            messages={messages}
            isThinking={isThinking}
            onSendMessage={handleSendMessage}
            pendingUpdates={pendingUpdates}
            onSync={handleSync}
          />
          <QuickActions onAction={handleQuickAction} isThinking={isThinking} />
        </div>
      </div>

      {/* Error Toast */}
      {sessionError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {sessionError}
        </div>
      )}
    </div>
  );
};

export default App;
