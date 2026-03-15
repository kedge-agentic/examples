/**
 * Skills Sidebar Component
 *
 * Displays the list of available skills with toggles.
 * Supports collapsible mode and skill management actions.
 */

import type { Skill } from '../types'
import { SkillToggle } from './SkillToggle'
import { RestartBanner } from './RestartBanner'

interface SkillsSidebarProps {
  skills: Skill[]
  needsRestart: boolean
  collapsed: boolean
  onToggle: (skillId: string) => void
  onRestart: () => void
  onToggleCollapse: () => void
  onAddSkill: () => void
  onEditSkill: (skill: Skill) => void
  onDeleteSkill: (skill: Skill) => void
}

export function SkillsSidebar({
  skills,
  needsRestart,
  collapsed,
  onToggle,
  onRestart,
  onToggleCollapse,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
}: SkillsSidebarProps) {
  const enabledCount = skills.filter(s => s.enabled).length

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
              <p className="text-sm text-gray-500 mt-1">
                {enabledCount} of {skills.length} enabled
              </p>
            </div>
          )}

          <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
            {/* Add Skill Button */}
            <button
              onClick={onAddSkill}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Add new skill"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Collapse/Expand Button */}
            <button
              onClick={onToggleCollapse}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Skills List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className={`${collapsed ? 'space-y-2 flex flex-col items-center' : 'space-y-3'}`}>
          {skills.map(skill => (
            <SkillToggle
              key={skill.id}
              skill={skill}
              collapsed={collapsed}
              onToggle={onToggle}
              onEdit={onEditSkill}
              onDelete={onDeleteSkill}
            />
          ))}
        </div>
      </div>

      {/* Restart Banner */}
      {needsRestart && !collapsed && (
        <div className="p-4 border-t border-gray-200">
          <RestartBanner onRestart={onRestart} />
        </div>
      )}

      {/* Collapsed Restart Indicator */}
      {needsRestart && collapsed && (
        <div className="p-2 border-t border-gray-200 flex justify-center">
          <button
            onClick={onRestart}
            className="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
            title="Restart required"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
