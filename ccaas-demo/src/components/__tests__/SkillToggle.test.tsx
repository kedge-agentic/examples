/**
 * SkillToggle Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SkillToggle } from '../SkillToggle'
import type { Skill } from '../../types'

const mockSkill: Skill = {
  id: 'skill-1',
  name: 'Test Skill',
  icon: '⚡',
  description: 'A test skill for testing',
  enabled: false,
  header: {
    whenToUse: 'When testing',
    objective: 'Test the skill toggle',
    triggers: ['test', 'demo'],
  },
}

describe('SkillToggle', () => {
  const mockOnToggle = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
  })

  it('renders skill name and description', () => {
    render(<SkillToggle skill={mockSkill} onToggle={mockOnToggle} />)
    expect(screen.getByText('Test Skill')).toBeInTheDocument()
    expect(screen.getByText('A test skill for testing')).toBeInTheDocument()
  })

  it('renders skill icon', () => {
    render(<SkillToggle skill={mockSkill} onToggle={mockOnToggle} />)
    expect(screen.getByText('⚡')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    render(<SkillToggle skill={mockSkill} onToggle={mockOnToggle} />)
    fireEvent.click(screen.getByText('Test Skill'))
    expect(mockOnToggle).toHaveBeenCalledWith('skill-1')
  })

  it('shows enabled state correctly', () => {
    const enabledSkill = { ...mockSkill, enabled: true }
    render(<SkillToggle skill={enabledSkill} onToggle={mockOnToggle} />)
    // Check for blue border when enabled
    const card = screen.getByText('Test Skill').closest('.border-2')
    expect(card?.className).toContain('border-blue-500')
  })

  it('shows disabled state correctly', () => {
    render(<SkillToggle skill={mockSkill} onToggle={mockOnToggle} />)
    const card = screen.getByText('Test Skill').closest('.border-2')
    expect(card?.className).toContain('border-gray-200')
  })

  // Collapsed mode tests
  describe('collapsed mode', () => {
    it('renders only icon in collapsed mode', () => {
      render(<SkillToggle skill={mockSkill} collapsed onToggle={mockOnToggle} />)
      expect(screen.getByText('⚡')).toBeInTheDocument()
      // In collapsed mode, the name only appears in tooltip, not as main text
      const iconContainer = screen.getByTitle('Test Skill')
      expect(iconContainer.querySelector('h3')).not.toBeInTheDocument()
    })

    it('shows tooltip with skill name on hover', () => {
      render(<SkillToggle skill={mockSkill} collapsed onToggle={mockOnToggle} />)
      const iconButton = screen.getByTitle('Test Skill')
      expect(iconButton).toBeInTheDocument()
    })

    it('calls onToggle when clicked in collapsed mode', () => {
      render(<SkillToggle skill={mockSkill} collapsed onToggle={mockOnToggle} />)
      fireEvent.click(screen.getByText('⚡'))
      expect(mockOnToggle).toHaveBeenCalledWith('skill-1')
    })
  })

  // Edit/Delete actions
  describe('edit and delete actions', () => {
    it('shows edit button on hover', () => {
      render(
        <SkillToggle
          skill={mockSkill}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      )
      const card = screen.getByText('Test Skill').closest('.border-2')
      fireEvent.mouseEnter(card!)
      expect(screen.getByTitle('Edit skill')).toBeInTheDocument()
    })

    it('calls onEdit when edit button is clicked', () => {
      render(
        <SkillToggle
          skill={mockSkill}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      )
      const card = screen.getByText('Test Skill').closest('.border-2')
      fireEvent.mouseEnter(card!)
      fireEvent.click(screen.getByTitle('Edit skill'))
      expect(mockOnEdit).toHaveBeenCalledWith(mockSkill)
      expect(mockOnToggle).not.toHaveBeenCalled()
    })

    it('shows delete button on hover', () => {
      render(
        <SkillToggle
          skill={mockSkill}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      )
      const card = screen.getByText('Test Skill').closest('.border-2')
      fireEvent.mouseEnter(card!)
      expect(screen.getByTitle('Delete skill')).toBeInTheDocument()
    })

    it('calls onDelete when delete button is clicked', () => {
      render(
        <SkillToggle
          skill={mockSkill}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      )
      const card = screen.getByText('Test Skill').closest('.border-2')
      fireEvent.mouseEnter(card!)
      fireEvent.click(screen.getByTitle('Delete skill'))
      expect(mockOnDelete).toHaveBeenCalledWith(mockSkill)
      expect(mockOnToggle).not.toHaveBeenCalled()
    })
  })

  // Expandable details
  describe('expandable details', () => {
    it('shows expand button when skill has header', () => {
      render(<SkillToggle skill={mockSkill} onToggle={mockOnToggle} />)
      expect(screen.getByText('Skill Details')).toBeInTheDocument()
    })

    it('expands to show details when clicked', () => {
      render(<SkillToggle skill={mockSkill} onToggle={mockOnToggle} />)
      fireEvent.click(screen.getByText('Skill Details'))
      expect(screen.getByText('When to Use')).toBeInTheDocument()
      expect(screen.getByText('When testing')).toBeInTheDocument()
      expect(screen.getByText('Objective')).toBeInTheDocument()
      expect(screen.getByText('Test the skill toggle')).toBeInTheDocument()
    })

    it('shows trigger keywords in expanded view', () => {
      render(<SkillToggle skill={mockSkill} onToggle={mockOnToggle} />)
      fireEvent.click(screen.getByText('Skill Details'))
      expect(screen.getByText('test')).toBeInTheDocument()
      expect(screen.getByText('demo')).toBeInTheDocument()
    })

    it('does not show expand button when skill has no header', () => {
      const skillNoHeader = { ...mockSkill, header: undefined }
      render(<SkillToggle skill={skillNoHeader} onToggle={mockOnToggle} />)
      expect(screen.queryByText('Skill Details')).not.toBeInTheDocument()
    })
  })
})
