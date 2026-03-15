import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileTreeNode } from '../FileTreeNode'
import type { FileTreeNode as FileTreeNodeType } from '../../../types'

describe('FileTreeNode', () => {
  const mockFile: FileTreeNodeType = {
    id: 'file-1',
    name: 'test.txt',
    type: 'file',
    path: 'test.txt',
    size: 2048,
    mimeType: 'text/plain',
  }

  const mockFolder: FileTreeNodeType = {
    id: 'folder-1',
    name: 'scripts',
    type: 'folder',
    path: 'scripts',
    children: [
      {
        id: 'file-2',
        name: 'setup.sh',
        type: 'file',
        path: 'scripts/setup.sh',
      },
    ],
  }

  const defaultProps = {
    level: 0,
    isExpanded: false,
    expandedFolders: new Set<string>(),
    onToggle: vi.fn(),
    onFileClick: vi.fn(),
    onToggleFolder: vi.fn(),
    isSearchMatch: false,
  }

  it('renders file node with name and size', () => {
    render(<FileTreeNode node={mockFile} {...defaultProps} />)
    expect(screen.getByText('test.txt')).toBeInTheDocument()
    expect(screen.getByText('2.0 KB')).toBeInTheDocument()
  })

  it('renders folder node with chevron icon', () => {
    render(<FileTreeNode node={mockFolder} {...defaultProps} />)
    expect(screen.getByText('scripts')).toBeInTheDocument()
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Expand folder scripts')
  })

  it('calls onToggle when folder is clicked', () => {
    const onToggle = vi.fn()
    render(<FileTreeNode node={mockFolder} {...defaultProps} onToggle={onToggle} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onFileClick when file is clicked', () => {
    const onFileClick = vi.fn()
    render(<FileTreeNode node={mockFile} {...defaultProps} onFileClick={onFileClick} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(onFileClick).toHaveBeenCalledWith(mockFile)
  })

  it('expands folder and shows children when isExpanded is true', () => {
    const expandedFolders = new Set(['folder-1'])
    render(
      <FileTreeNode
        node={mockFolder}
        {...defaultProps}
        isExpanded={true}
        expandedFolders={expandedFolders}
      />
    )

    expect(screen.getByText('setup.sh')).toBeInTheDocument()
  })

  it('does not show children when isExpanded is false', () => {
    render(<FileTreeNode node={mockFolder} {...defaultProps} isExpanded={false} />)

    expect(screen.queryByText('setup.sh')).not.toBeInTheDocument()
  })

  it('applies search match highlight class', () => {
    render(<FileTreeNode node={mockFile} {...defaultProps} isSearchMatch={true} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-green-500/10', 'border-l-2', 'border-green-500')
  })

  it('applies correct indentation based on level', () => {
    render(<FileTreeNode node={mockFile} {...defaultProps} level={2} />)

    const button = screen.getByRole('button')
    expect(button).toHaveStyle({ paddingLeft: '44px' }) // 2 * 16 + 12
  })

  it('shows different aria-label when folder is expanded', () => {
    render(<FileTreeNode node={mockFolder} {...defaultProps} isExpanded={true} />)

    const button = screen.getByLabelText('Collapse folder scripts')
    expect(button).toBeInTheDocument()
  })

  it('does not show size for folders', () => {
    render(<FileTreeNode node={mockFolder} {...defaultProps} />)

    expect(screen.queryByText(/KB|MB|GB/)).not.toBeInTheDocument()
  })

  it('handles file without size', () => {
    const fileWithoutSize: FileTreeNodeType = {
      ...mockFile,
      size: undefined,
    }

    render(<FileTreeNode node={fileWithoutSize} {...defaultProps} />)

    expect(screen.queryByText(/KB|MB|GB/)).not.toBeInTheDocument()
  })
})
