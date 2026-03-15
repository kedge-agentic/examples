import React from 'react';
import { Message, SyncField, OutputUpdate, ContentBlock, ToolActivity } from '../../types';

interface MessageBubbleProps {
  message: Message;
  onSync: (field: SyncField) => void;
  pendingUpdates: Map<SyncField, OutputUpdate>;
}

const fieldLabels: Record<SyncField, string> = {
  problemAnalysis: '题目分析',
  keyKnowledge: '知识点',
  solutionSteps: '解题步骤',
  answer: '答案',
  commonMistakes: '易错点',
  relatedProblems: '变式练习',
  hints: '提示',
  difficulty: '难度',
};

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
  write_output: '📤',
};

function getToolSummary(tool: ToolActivity): string {
  if (tool.description) return tool.description;
  const input = tool.toolInput as Record<string, unknown> | undefined;
  if (!input) return '';
  const name = tool.toolName.replace(/^mcp__[^_]+__/, '');
  if (name === 'Read' || name === 'Write' || name === 'Edit') {
    const p = (input.file_path as string) || '';
    if (!p) return '';
    const parts = p.split('/');
    return parts.length <= 2 ? p : '.../' + parts.slice(-2).join('/');
  }
  if (name === 'Bash') {
    const cmd = (input.command as string) || '';
    return cmd.length > 60 ? cmd.slice(0, 57) + '...' : cmd;
  }
  if (name === 'Glob' || name === 'Grep') return (input.pattern as string) || '';
  if (name === 'write_output') return (input.field as string) || '';
  return '';
}

function InlineToolCard({ tool }: { tool: ToolActivity }) {
  const t = tool;
  const icon = TOOL_ICONS[t.toolName] || (t.toolName.includes('write_output') ? '📤' : '🔧');
  const displayName = t.toolName.replace(/^mcp__[^_]+__/, '');
  const summary = getToolSummary(t);

  const durationText = t.duration
    ? t.duration > 1000
      ? `${(t.duration / 1000).toFixed(1)}s`
      : `${t.duration}ms`
    : null;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 my-1 text-xs bg-white/80 border border-gray-200 rounded-md text-gray-600"
      title={t.toolError || `${displayName} ${t.phase}`}
    >
      <span>{icon}</span>
      <span className="font-medium text-gray-700">{displayName}</span>
      {summary && (
        <span className="text-gray-500 truncate max-w-[200px]">{summary}</span>
      )}
      {t.phase === 'start' ? (
        <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : t.success !== false ? (
        <span>✅</span>
      ) : (
        <span>❌</span>
      )}
      {durationText && <span className="text-gray-400">{durationText}</span>}
    </div>
  );
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSync,
  pendingUpdates,
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={'flex ' + (isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={
          'max-w-[85%] rounded-lg px-3 py-2 ' +
          (isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800')
        }
      >
        {/* Content with inline tool cards */}
        {message.contentBlocks && message.contentBlocks.length > 0 ? (
          <div className="text-sm">
            {message.contentBlocks.map((block: ContentBlock, i: number) =>
              block.type === 'text' ? (
                <span key={i} className="whitespace-pre-wrap">{block.text}</span>
              ) : (
                <InlineToolCard key={block.tool.toolId || i} tool={block.tool} />
              )
            )}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5" />
            )}
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5" />
            )}
          </div>
        )}

        {/* Output Updates */}
        {message.outputUpdates && message.outputUpdates.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
            {message.outputUpdates.map((update, i) => {
              const isPending = pendingUpdates.has(update.field);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600">
                    {fieldLabels[update.field] || update.field}
                  </span>
                  {isPending ? (
                    <button
                      onClick={() => onSync(update.field)}
                      className="px-2 py-0.5 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      同步
                    </button>
                  ) : update.synced ? (
                    <span className="text-green-600">✓</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
