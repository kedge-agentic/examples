/**
 * SkillEditor Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SkillEditor } from '../SkillEditor'
import type { Skill } from '../../types'

const mockSkill: Skill = {
  id: 'skill-1',
  name: 'Test Skill',
  slug: 'test-skill',
  icon: '🤖',
  description: 'A test skill',
  enabled: true,
  type: 'skill',
  content: '# Test Content',
  header: {
    whenToUse: 'When testing',
    objective: 'Test objective',
    triggers: ['test', 'demo'],
  },
}

describe('SkillEditor', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnSave.mockClear()
    mockOnSave.mockResolvedValue(undefined)
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <SkillEditor
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders create mode when no skill provided', () => {
    render(
      <SkillEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )
    // Modal title should be "Create Skill"
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByPlaceholderText('My Awesome Skill')).toHaveValue('')
  })

  it('renders edit mode when skill provided', () => {
    render(
      <SkillEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        skill={mockSkill}
        initialContent="# Test Content"
      />
    )
    expect(screen.getByText('Edit Skill')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('My Awesome Skill')).toHaveValue('Test Skill')
  })

  it('populates form fields from skill in edit mode', () => {
    render(
      <SkillEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        skill={mockSkill}
        initialContent="# Test Content"
      />
    )
    expect(screen.getByPlaceholderText('My Awesome Skill')).toHaveValue('Test Skill')
    expect(screen.getByPlaceholderText('my-awesome-skill')).toHaveValue('test-skill')
    expect(screen.getByPlaceholderText('A brief description of what this skill does')).toHaveValue('A test skill')
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  // Validation tests
  describe('validation', () => {
    it('shows error when name is empty', async () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      // Find the submit button (not the modal title)
      const submitButton = screen.getAllByText('Create Skill').find(el => el.tagName === 'BUTTON')
      fireEvent.click(submitButton!)
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('shows error when name is too long', async () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } })
      const submitButton = screen.getAllByText('Create Skill').find(el => el.tagName === 'BUTTON')
      fireEvent.click(submitButton!)
      await waitFor(() => {
        expect(screen.getByText('Name must be 100 characters or less')).toBeInTheDocument()
      })
    })

    it('shows error when slug is empty', async () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: '!!!' } }) // Will result in empty slug
      const submitButton = screen.getAllByText('Create Skill').find(el => el.tagName === 'BUTTON')
      fireEvent.click(submitButton!)
      await waitFor(() => {
        expect(screen.getByText('Slug is required')).toBeInTheDocument()
      })
    })

    it('allows slug with valid characters only', async () => {
      // Note: slugify() auto-converts input to valid slug, so invalid chars are cleaned
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'Test' } })
      const slugInput = screen.getByPlaceholderText('my-awesome-skill')
      fireEvent.change(slugInput, { target: { value: 'Test Slug!' } })
      // slugify converts "Test Slug!" to "test-slug"
      expect(slugInput).toHaveValue('test-slug')
    })

    it('shows error when description is too long', async () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'Test' } })
      const descInput = screen.getByPlaceholderText('A brief description of what this skill does')
      fireEvent.change(descInput, { target: { value: 'a'.repeat(501) } })
      const submitButton = screen.getAllByText('Create Skill').find(el => el.tagName === 'BUTTON')
      fireEvent.click(submitButton!)
      await waitFor(() => {
        expect(screen.getByText('Description must be 500 characters or less')).toBeInTheDocument()
      })
    })
  })

  // Auto-slug generation
  describe('slug auto-generation', () => {
    it('auto-generates slug from name', () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'My New Skill' } })
      expect(screen.getByPlaceholderText('my-awesome-skill')).toHaveValue('my-new-skill')
    })

    it('stops auto-generating slug after manual edit', () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      const slugInput = screen.getByPlaceholderText('my-awesome-skill')
      fireEvent.change(slugInput, { target: { value: 'custom-slug' } })

      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } })

      expect(slugInput).toHaveValue('custom-slug')
    })
  })

  // Form submission
  describe('form submission', () => {
    it('calls onSave with form data on successful submit', async () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'New Skill' } })

      const descInput = screen.getByPlaceholderText('A brief description of what this skill does')
      fireEvent.change(descInput, { target: { value: 'A description' } })

      const submitButton = screen.getAllByText('Create Skill').find(el => el.tagName === 'BUTTON')
      fireEvent.click(submitButton!)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
          name: 'New Skill',
          slug: 'new-skill',
          description: 'A description',
          type: 'skill',
        }))
      })
    })

    it('calls onClose after successful save', async () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'New Skill' } })

      const submitButton = screen.getAllByText('Create Skill').find(el => el.tagName === 'BUTTON')
      fireEvent.click(submitButton!)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('shows error message when save fails', async () => {
      mockOnSave.mockRejectedValue(new Error('Save failed'))

      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'New Skill' } })

      const submitButton = screen.getAllByText('Create Skill').find(el => el.tagName === 'BUTTON')
      fireEvent.click(submitButton!)

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument()
      })
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('shows saving state during submission', async () => {
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const nameInput = screen.getByPlaceholderText('My Awesome Skill')
      fireEvent.change(nameInput, { target: { value: 'New Skill' } })

      const submitButton = screen.getAllByText('Create Skill').find(el => el.tagName === 'BUTTON')
      fireEvent.click(submitButton!)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })

  // Cancel
  describe('cancel', () => {
    it('calls onClose when Cancel is clicked', () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      fireEvent.click(screen.getByText('Cancel'))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  // Type selection
  describe('type selection', () => {
    it('allows changing skill type', () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      // Find select by its options
      const typeSelect = screen.getByDisplayValue('Skill')
      fireEvent.change(typeSelect, { target: { value: 'sub-agent' } })
      expect(typeSelect).toHaveValue('sub-agent')
    })
  })

  // Icon selection
  describe('icon selection', () => {
    it('renders icon options', () => {
      render(
        <SkillEditor
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )
      // Find select by its default value (the emoji)
      const iconSelect = screen.getByDisplayValue('⚡')
      expect(iconSelect).toBeInTheDocument()
    })
  })
})
