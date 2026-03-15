/**
 * Skill Toggle Component
 *
 * Displays a single skill with enable/disable toggle and expandable header info.
 * Supports collapsed mode for sidebar minimization.
 */

import { useState } from 'react'
import type { Skill } from '../types'

interface SkillToggleProps {
  skill: Skill
  collapsed?: boolean
  onToggle: (skillId: string) => void
  onEdit?: (skill: Skill) => void
  onDelete?: (skill: Skill) => void
}

export function SkillToggle({
  skill,
  collapsed = false,
  onToggle,
  onEdit,
  onDelete,
}: SkillToggleProps) {
  const [expanded, setExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)

  // Collapsed mode - show only icon with tooltip
  if (collapsed) {
    return (
      <div
        className={`relative group w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer transition-all ${
          skill.enabled
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        onClick={() => onToggle(skill.id)}
        title={skill.name}
      >
        <span className="text-xl">{skill.icon}</span>
        {/* Tooltip */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
          {skill.name}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border-2 transition-all ${
        skill.enabled
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Main toggle area */}
      <div className="p-4 cursor-pointer" onClick={() => onToggle(skill.id)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{skill.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate">{skill.name}</h3>
              <p className="text-sm text-gray-500 truncate">{skill.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {/* Edit/Delete buttons */}
            {showActions && (onEdit || onDelete) && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(skill)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit skill"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(skill)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete skill"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Toggle switch */}
            <div
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                skill.enabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  skill.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable header info */}
      {skill.header && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:text-gray-700 border-t border-gray-100 flex items-center gap-2"
          >
            <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span>Skill Details</span>
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3 text-sm animate-slide-in">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">🎯</span>
                  <div>
                    <p className="font-medium text-gray-700">When to Use</p>
                    <p className="text-gray-600">{skill.header.whenToUse}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✅</span>
                  <div>
                    <p className="font-medium text-gray-700">Objective</p>
                    <p className="text-gray-600">{skill.header.objective}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">🔑</span>
                  <div>
                    <p className="font-medium text-gray-700">Trigger Keywords</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {skill.header.triggers.map((trigger) => (
                        <span
                          key={trigger}
                          className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs"
                        >
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
