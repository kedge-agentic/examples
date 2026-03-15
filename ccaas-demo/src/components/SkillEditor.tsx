/**
 * SkillEditor Component
 *
 * Modal for creating and editing skills with markdown content support.
 */

import { useState, useEffect } from 'react'
import type { Skill, SkillFormData } from '../types'
import { Modal } from './Modal'
import { TagInput } from './TagInput'
import { slugify } from '../utils/slugify'

interface SkillEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: SkillFormData) => Promise<void>
  skill?: Skill | null       // null for create, Skill for edit
  initialContent?: string    // Pre-fetched content for edit mode
}

const EMOJI_OPTIONS = ['⚡', '🤖', '📊', '📝', '🔍', '🎯', '💡', '🔧', '🚀', '✨', '🎨', '📚']

const DEFAULT_CONTENT = `# Skill Title

## When to Use
Describe when this skill should be activated.

## Instructions
Step-by-step instructions for Claude to follow.

## Examples
Provide example interactions or outputs.
`

export function SkillEditor({
  isOpen,
  onClose,
  onSave,
  skill,
  initialContent,
}: SkillEditorProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [type, setType] = useState<'skill' | 'sub-agent'>('skill')
  const [triggers, setTriggers] = useState<string[]>([])
  const [icon, setIcon] = useState('⚡')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSlug, setAutoSlug] = useState(true)

  // Reset form when modal opens/closes or skill changes
  useEffect(() => {
    if (isOpen) {
      if (skill) {
        // Edit mode - populate from skill
        setName(skill.name)
        setSlug(skill.slug || slugify(skill.name))
        setDescription(skill.description)
        setContent(initialContent || skill.content || DEFAULT_CONTENT)
        setType(skill.type || 'skill')
        setTriggers(skill.header?.triggers || [])
        setIcon(skill.icon)
        setAutoSlug(false)
      } else {
        // Create mode - reset to defaults
        setName('')
        setSlug('')
        setDescription('')
        setContent(DEFAULT_CONTENT)
        setType('skill')
        setTriggers([])
        setIcon('⚡')
        setAutoSlug(true)
      }
      setError(null)
    }
  }, [isOpen, skill, initialContent])

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && name) {
      setSlug(slugify(name))
    }
  }, [name, autoSlug])

  const handleSlugChange = (value: string) => {
    setAutoSlug(false)
    setSlug(slugify(value))
  }

  const handleSubmit = async () => {
    // Prevent double submission
    if (saving) return

    const trimmedName = name.trim()
    const trimmedSlug = slug.trim()
    const trimmedDescription = description.trim()

    // Validation
    if (!trimmedName) {
      setError('Name is required')
      return
    }
    if (trimmedName.length > 100) {
      setError('Name must be 100 characters or less')
      return
    }
    if (!trimmedSlug) {
      setError('Slug is required')
      return
    }
    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens')
      return
    }
    if (trimmedSlug.length > 100) {
      setError('Slug must be 100 characters or less')
      return
    }
    if (trimmedDescription.length > 500) {
      setError('Description must be 500 characters or less')
      return
    }
    if (content.length > 50000) {
      setError('Content exceeds maximum length (50,000 characters)')
      return
    }

    const formData: SkillFormData = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      content: content,
      type,
      icon,
      whenToUse: description.trim(),
      triggers: triggers,
    }

    try {
      setSaving(true)
      setError(null)
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save skill')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={skill ? 'Edit Skill' : 'Create Skill'}
      size="xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Name and Icon */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Skill"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <div className="relative">
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg appearance-none text-center text-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <option key={emoji} value={emoji}>
                    {emoji}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(auto-generated)</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="my-awesome-skill"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'skill' | 'sub-agent')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="skill">Skill</option>
            <option value="sub-agent">Sub-Agent</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of what this skill does"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Triggers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trigger Keywords
          </label>
          <TagInput
            tags={triggers}
            onChange={setTriggers}
            placeholder="Type keyword and press Enter..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Keywords that will activate this skill
          </p>
        </div>

        {/* Content (Markdown) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="# Skill instructions in Markdown format..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : skill ? 'Save Changes' : 'Create Skill'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
