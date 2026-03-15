import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileTree } from '../FileTree'
import type { FileTreeNode } from '../../../types'

describe('FileTree', () => {
  const mockTree: FileTreeNode[] = [
    {
      id: 'folder-1',
      name: 'scripts',
      type: 'folder',
      path: 'scripts',
      children: [
        {
          id: 'file-1',
          name: 'setup.sh',
          type: 'file',
          path: 'scripts/setup.sh',
        },
      ],
    },
    {
      id: 'file-2',
      name: 'readme.md',
      type: 'file',
      path: 'readme.md',
      size: 1024,
    },
  ]

  const defaultProps = {
    expandedFolders: new Set<string>(),
    onToggleFolder: vi.fn(),
    onFileClick: vi.fn(),
    searchQuery: '',
  }

  it('renders file tree with nodes', () => {
    render(<FileTree nodes={mockTree} {...defaultProps} />)

    expect(screen.getByText('scripts')).toBeInTheDocument()
    expect(screen.getByText('readme.md')).toBeInTheDocument()
  })

  it('shows empty state when no nodes', () => {
    render(<FileTree nodes={[]} {...defaultProps} />)

    expect(screen.getByText('No files in workspace')).toBeInTheDocument()
  })

  it('shows search-specific empty state', () => {
    render(<FileTree nodes={[]} {...defaultProps} searchQuery="test" />)

    expect(screen.getByText('No files match your search')).toBeInTheDocument()
  })

  it('renders all top-level nodes', () => {
    render(<FileTree nodes={mockTree} {...defaultProps} />)

    // Should render both folder and file at top level
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('passes correct props to FileTreeNode', () => {
    const onToggleFolder = vi.fn()
    const onFileClick = vi.fn()

    render(
      <FileTree
        nodes={mockTree}
        {...defaultProps}
        onToggleFolder={onToggleFolder}
        onFileClick={onFileClick}
      />
    )

    expect(screen.getByText('scripts')).toBeInTheDocument()
    expect(screen.getByText('readme.md')).toBeInTheDocument()
  })
})
