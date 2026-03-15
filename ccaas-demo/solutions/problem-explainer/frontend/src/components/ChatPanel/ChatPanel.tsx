import React, { useState, useRef, useEffect } from 'react';
import { Message, SyncField, OutputUpdate } from '../../types';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  messages: Message[];
  isThinking: boolean;
  onSendMessage: (content: string) => void;
  pendingUpdates: Map<SyncField, OutputUpdate>;
  onSync: (field: SyncField) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isThinking,
  onSendMessage,
  pendingUpdates,
  onSync,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            输入题目后，点击"开始讲解"
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSync={onSync}
            pendingUpdates={pendingUpdates}
          />
        ))}
        {isThinking && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="animate-pulse">●</div>
            <div className="animate-pulse animation-delay-200">●</div>
            <div className="animate-pulse animation-delay-400">●</div>
            <span>思考中...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending Updates Summary */}
      {pendingUpdates.size > 0 && (
        <div className="px-3 py-2 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-800">
              {pendingUpdates.size} 项待同步
            </span>
            <button
              onClick={() => {
                pendingUpdates.forEach((_, field) => onSync(field));
              }}
              className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
            >
              全部同步
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入问题或指令..."
            disabled={isThinking}
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
};
