import React from 'react';

interface QuickActionsProps {
  onAction: (action: string) => void;
  isThinking: boolean;
}

const actions = [
  { id: 'start', label: '开始讲解', icon: '▶️' },
  { id: 'next', label: '下一步', icon: '➡️' },
  { id: 'detail', label: '更详细', icon: '🔍' },
  { id: 'practice', label: '举一反三', icon: '🔄' },
];

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAction,
  isThinking,
}) => {
  return (
    <div className="p-3 border-t border-gray-200 bg-gray-50">
      <div className="text-xs text-gray-500 mb-2">快捷指令</div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            disabled={isThinking}
            className="flex items-center justify-center space-x-1 px-3 py-2 bg-white border rounded text-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
