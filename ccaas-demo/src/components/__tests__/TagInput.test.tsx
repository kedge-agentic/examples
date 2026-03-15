/**
 * TagInput Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TagInput } from '../TagInput'

describe('TagInput', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with placeholder when no tags', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} placeholder="Add tag..." />)
    expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument()
  })

  it('renders existing tags', () => {
    render(<TagInput tags={['tag1', 'tag2']} onChange={mockOnChange} />)
    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
  })

  it('adds a tag when Enter is pressed', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'newtag' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockOnChange).toHaveBeenCalledWith(['newtag'])
  })

  it('adds a tag when comma is pressed', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'newtag' } })
    fireEvent.keyDown(input, { key: ',' })
    expect(mockOnChange).toHaveBeenCalledWith(['newtag'])
  })

  it('trims whitespace from tags', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '  newtag  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockOnChange).toHaveBeenCalledWith(['newtag'])
  })

  it('does not add duplicate tags', () => {
    render(<TagInput tags={['existing']} onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'existing' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('does not add empty tags', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('removes last tag when Backspace is pressed with empty input', () => {
    render(<TagInput tags={['tag1', 'tag2']} onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(mockOnChange).toHaveBeenCalledWith(['tag1'])
  })

  it('does not remove tag when Backspace is pressed with input value', () => {
    render(<TagInput tags={['tag1', 'tag2']} onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'text' } })
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('removes specific tag when remove button is clicked', () => {
    render(<TagInput tags={['tag1', 'tag2', 'tag3']} onChange={mockOnChange} />)
    const removeButtons = screen.getAllByRole('button')
    const buttonToClick = removeButtons[1]
    expect(buttonToClick).toBeDefined()
    fireEvent.click(buttonToClick!) // Remove 'tag2'
    expect(mockOnChange).toHaveBeenCalledWith(['tag1', 'tag3'])
  })

  it('clears input after adding a tag', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'newtag' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input.value).toBe('')
  })

  it('hides placeholder when tags exist', () => {
    render(<TagInput tags={['tag1']} onChange={mockOnChange} placeholder="Add tag..." />)
    expect(screen.queryByPlaceholderText('Add tag...')).not.toBeInTheDocument()
  })
})
