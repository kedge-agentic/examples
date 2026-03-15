import React from 'react';
import { SolutionStep } from '../../types';

interface SolutionStepsProps {
  steps: SolutionStep[];
}

export const SolutionSteps: React.FC<SolutionStepsProps> = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return <div className="text-gray-400 text-sm">暂无步骤</div>;
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="border-l-2 border-blue-500 pl-3">
          <div className="font-medium text-blue-700 text-sm mb-1">
            Step {step.stepNumber}: {step.description}
          </div>
          {step.formula && (
            <div className="bg-gray-50 p-2 rounded text-sm font-mono mb-1">
              {step.formula}
            </div>
          )}
          <div className="text-sm text-gray-600">{step.explanation}</div>
        </div>
      ))}
    </div>
  );
};
