import React from 'react';
import { Explanation, SyncField, OutputUpdate, SolutionStep } from '../../types';
import { SolutionSteps } from './SolutionSteps';

interface ExplanationPanelProps {
  explanation: Explanation | null;
  pendingUpdates: Map<SyncField, OutputUpdate>;
  modifiedFields: Set<SyncField>;
  onSync: (field: SyncField) => void;
  onDiscard: (field: SyncField) => void;
  onUndo: (field: SyncField) => void;
  canUndo: (field: SyncField) => boolean;
}

interface SectionProps {
  title: string;
  icon: string;
  field: SyncField;
  content: React.ReactNode;
  pendingUpdate?: OutputUpdate;
  isModified: boolean;
  onSync: () => void;
  onDiscard: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon,
  field,
  content,
  pendingUpdate,
  isModified,
  onSync,
  onDiscard,
  onUndo,
  canUndo,
}) => {
  return (
    <div
      className={
        'bg-white rounded-lg shadow-sm border p-4 mb-4 ' +
        (pendingUpdate ? 'border-yellow-400 sync-pending' : 'border-gray-200')
      }
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800 flex items-center">
          <span className="mr-2">{icon}</span>
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          {pendingUpdate && (
            <>
              <button
                onClick={onSync}
                className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                同步
              </button>
              <button
                onClick={onDiscard}
                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                放弃
              </button>
            </>
          )}
          {canUndo && (
            <button
              onClick={onUndo}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              撤销
            </button>
          )}
          {isModified && !pendingUpdate && !canUndo && (
            <span className="text-xs text-green-600">✓ 已同步</span>
          )}
        </div>
      </div>

      {/* Preview of pending update */}
      {pendingUpdate && (
        <div className="mb-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
          <span className="font-medium">待同步: </span>
          {pendingUpdate.preview}
        </div>
      )}

      {/* Content */}
      <div className="text-gray-700">{content}</div>
    </div>
  );
};

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  explanation,
  pendingUpdates,
  modifiedFields,
  onSync,
  onDiscard,
  onUndo,
  canUndo,
}) => {
  const renderArrayContent = (items: string[] | undefined) => {
    if (!items || items.length === 0) {
      return <div className="text-gray-400 text-sm">暂无内容</div>;
    }
    return (
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">讲解内容</h2>

      {/* Problem Analysis */}
      <Section
        title="题目分析"
        icon="📋"
        field="problemAnalysis"
        content={
          <p className="text-sm whitespace-pre-wrap">
            {explanation?.problemAnalysis || '暂无分析'}
          </p>
        }
        pendingUpdate={pendingUpdates.get('problemAnalysis')}
        isModified={modifiedFields.has('problemAnalysis')}
        onSync={() => onSync('problemAnalysis')}
        onDiscard={() => onDiscard('problemAnalysis')}
        onUndo={() => onUndo('problemAnalysis')}
        canUndo={canUndo('problemAnalysis')}
      />

      {/* Key Knowledge */}
      <Section
        title="核心知识点"
        icon="🎯"
        field="keyKnowledge"
        content={renderArrayContent(explanation?.keyKnowledge)}
        pendingUpdate={pendingUpdates.get('keyKnowledge')}
        isModified={modifiedFields.has('keyKnowledge')}
        onSync={() => onSync('keyKnowledge')}
        onDiscard={() => onDiscard('keyKnowledge')}
        onUndo={() => onUndo('keyKnowledge')}
        canUndo={canUndo('keyKnowledge')}
      />

      {/* Solution Steps */}
      <Section
        title="解题步骤"
        icon="📝"
        field="solutionSteps"
        content={<SolutionSteps steps={explanation?.solutionSteps || []} />}
        pendingUpdate={pendingUpdates.get('solutionSteps')}
        isModified={modifiedFields.has('solutionSteps')}
        onSync={() => onSync('solutionSteps')}
        onDiscard={() => onDiscard('solutionSteps')}
        onUndo={() => onUndo('solutionSteps')}
        canUndo={canUndo('solutionSteps')}
      />

      {/* Answer */}
      <Section
        title="答案"
        icon="✅"
        field="answer"
        content={
          <p className="text-sm font-medium">
            {explanation?.answer || '暂无答案'}
          </p>
        }
        pendingUpdate={pendingUpdates.get('answer')}
        isModified={modifiedFields.has('answer')}
        onSync={() => onSync('answer')}
        onDiscard={() => onDiscard('answer')}
        onUndo={() => onUndo('answer')}
        canUndo={canUndo('answer')}
      />

      {/* Common Mistakes */}
      <Section
        title="易错点"
        icon="⚠️"
        field="commonMistakes"
        content={renderArrayContent(explanation?.commonMistakes)}
        pendingUpdate={pendingUpdates.get('commonMistakes')}
        isModified={modifiedFields.has('commonMistakes')}
        onSync={() => onSync('commonMistakes')}
        onDiscard={() => onDiscard('commonMistakes')}
        onUndo={() => onUndo('commonMistakes')}
        canUndo={canUndo('commonMistakes')}
      />

      {/* Related Problems */}
      <Section
        title="变式练习"
        icon="🔄"
        field="relatedProblems"
        content={renderArrayContent(explanation?.relatedProblems)}
        pendingUpdate={pendingUpdates.get('relatedProblems')}
        isModified={modifiedFields.has('relatedProblems')}
        onSync={() => onSync('relatedProblems')}
        onDiscard={() => onDiscard('relatedProblems')}
        onUndo={() => onUndo('relatedProblems')}
        canUndo={canUndo('relatedProblems')}
      />
    </div>
  );
};
