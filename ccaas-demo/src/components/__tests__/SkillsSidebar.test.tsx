/**
 * SkillsSidebar Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SkillsSidebar } from '../SkillsSidebar'
import type { Skill } from '../../types'

const mockSkills: Skill[] = [
  {
    id: 'skill-1',
    name: 'Skill One',
    icon: '⚡',
    description: 'First skill',
    enabled: true,
  },
  {
    id: 'skill-2',
    name: 'Skill Two',
    icon: '🤖',
    description: 'Second skill',
    enabled: false,
  },
  {
    id: 'skill-3',
    name: 'Skill Three',
    icon: '📊',
    description: 'Third skill',
    enabled: true,
  },
]

describe('SkillsSidebar', () => {
  const mockOnToggle = vi.fn()
  const mockOnRestart = vi.fn()
  const mockOnToggleCollapse = vi.fn()
  const mockOnAddSkill = vi.fn()
  const mockOnEditSkill = vi.fn()
  const mockOnDeleteSkill = vi.fn()

  const defaultProps = {
    skills: mockSkills,
    needsRestart: false,
    collapsed: false,
    onToggle: mockOnToggle,
    onRestart: mockOnRestart,
    onToggleCollapse: mockOnToggleCollapse,
    onAddSkill: mockOnAddSkill,
    onEditSkill: mockOnEditSkill,
    onDeleteSkill: mockOnDeleteSkill,
  }

  beforeEach(() => {
    mockOnToggle.mockClear()
    mockOnRestart.mockClear()
    mockOnToggleCollapse.mockClear()
    mockOnAddSkill.mockClear()
    mockOnEditSkill.mockClear()
    mockOnDeleteSkill.mockClear()
  })

  it('renders all skills', () => {
    render(<SkillsSidebar {...defaultProps} />)
    expect(screen.getByText('Skill One')).toBeInTheDocument()
    expect(screen.getByText('Skill Two')).toBeInTheDocument()
    expect(screen.getByText('Skill Three')).toBeInTheDocument()
  })

  it('shows enabled count', () => {
    render(<SkillsSidebar {...defaultProps} />)
    expect(screen.getByText('2 of 3 enabled')).toBeInTheDocument()
  })

  it('renders header with Skills title', () => {
    render(<SkillsSidebar {...defaultProps} />)
    expect(screen.getByText('Skills')).toBeInTheDocument()
  })

  // Collapse functionality
  describe('collapse functionality', () => {
    it('calls onToggleCollapse when collapse button is clicked', () => {
      render(<SkillsSidebar {...defaultProps} />)
      fireEvent.click(screen.getByTitle('Collapse sidebar'))
      expect(mockOnToggleCollapse).toHaveBeenCalledTimes(1)
    })

    it('shows expand title when collapsed', () => {
      render(<SkillsSidebar {...defaultProps} collapsed />)
      expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument()
    })

    it('hides header text when collapsed', () => {
      render(<SkillsSidebar {...defaultProps} collapsed />)
      expect(screen.queryByText('Skills')).not.toBeInTheDocument()
      expect(screen.queryByText('2 of 3 enabled')).not.toBeInTheDocument()
    })

    it('applies narrow width when collapsed', () => {
      const { container } = render(<SkillsSidebar {...defaultProps} collapsed />)
      const sidebar = container.firstChild
      expect(sidebar).toHaveClass('w-16')
    })

    it('applies wide width when expanded', () => {
      const { container } = render(<SkillsSidebar {...defaultProps} />)
      const sidebar = container.firstChild
      expect(sidebar).toHaveClass('w-80')
    })
  })

  // Add skill
  describe('add skill button', () => {
    it('calls onAddSkill when add button is clicked', () => {
      render(<SkillsSidebar {...defaultProps} />)
      fireEvent.click(screen.getByTitle('Add new skill'))
      expect(mockOnAddSkill).toHaveBeenCalledTimes(1)
    })

    it('shows add button in collapsed mode', () => {
      render(<SkillsSidebar {...defaultProps} collapsed />)
      expect(screen.getByTitle('Add new skill')).toBeInTheDocument()
    })
  })

  // Restart banner
  describe('restart banner', () => {
    it('shows restart banner when needsRestart is true', () => {
      render(<SkillsSidebar {...defaultProps} needsRestart />)
      // RestartBanner should be rendered with the restart button
      expect(screen.getByText('Restart Session')).toBeInTheDocument()
    })

    it('does not show restart banner when needsRestart is false', () => {
      render(<SkillsSidebar {...defaultProps} needsRestart={false} />)
      // Check that restart banner is not shown
      const restartButton = screen.queryByText(/Restart Session/i)
      expect(restartButton).not.toBeInTheDocument()
    })

    it('shows restart indicator button in collapsed mode', () => {
      render(<SkillsSidebar {...defaultProps} needsRestart collapsed />)
      const restartButton = screen.getByTitle('Restart required')
      expect(restartButton).toBeInTheDocument()
    })

    it('calls onRestart when restart button is clicked in collapsed mode', () => {
      render(<SkillsSidebar {...defaultProps} needsRestart collapsed />)
      fireEvent.click(screen.getByTitle('Restart required'))
      expect(mockOnRestart).toHaveBeenCalledTimes(1)
    })
  })

  // Empty state
  describe('empty state', () => {
    it('renders empty sidebar when no skills', () => {
      render(<SkillsSidebar {...defaultProps} skills={[]} />)
      expect(screen.getByText('0 of 0 enabled')).toBeInTheDocument()
    })
  })
})
