/**
 * FileTreeItem Component Tests
 *
 * Tests for the tree node component including:
 * - File and folder rendering
 * - Expand/collapse folders
 * - Status badges
 * - File icons
 * - Click handlers
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileTreeItem } from '../FileTreeItem'
import type { FileNode } from '../../types'

describe('FileTreeItem', () => {
  const defaultProps = {
    depth: 0,
    expandedFolders: new Set<string>(),
    onToggleFolder: vi.fn(),
    onPreviewFile: vi.fn(),
    onDownloadFile: vi.fn(),
  }

  describe('file node', () => {
    const fileNode: FileNode = {
      id: 'file-1',
      name: 'readme.md',
      type: 'file',
      path: '/readme.md',
      fileId: 'uuid-1',
      mimeType: 'text/markdown',
      size: 1024,
      status: 'new',
    }

    it('should render file name', () => {
      render(<FileTreeItem {...defaultProps} node={fileNode} />)

      expect(screen.getByText('readme.md')).toBeInTheDocument()
    })

    it('should call onPreviewFile when clicked', () => {
      const onPreviewFile = vi.fn()
      render(
        <FileTreeItem {...defaultProps} node={fileNode} onPreviewFile={onPreviewFile} />
      )

      fireEvent.click(screen.getByText('readme.md'))

      expect(onPreviewFile).toHaveBeenCalledWith(fileNode)
    })

    it('should call onDownloadFile when download button clicked', () => {
      const onDownloadFile = vi.fn()
      render(
        <FileTreeItem {...defaultProps} node={fileNode} onDownloadFile={onDownloadFile} />
      )

      // Hover to reveal download button
      fireEvent.mouseEnter(screen.getByText('readme.md').parentElement!)
      fireEvent.click(screen.getByTitle('Download'))

      expect(onDownloadFile).toHaveBeenCalledWith(fileNode)
    })

    it('should not propagate click to preview when download clicked', () => {
      const onPreviewFile = vi.fn()
      const onDownloadFile = vi.fn()
      render(
        <FileTreeItem
          {...defaultProps}
          node={fileNode}
          onPreviewFile={onPreviewFile}
          onDownloadFile={onDownloadFile}
        />
      )

      fireEvent.mouseEnter(screen.getByText('readme.md').parentElement!)
      fireEvent.click(screen.getByTitle('Download'))

      expect(onDownloadFile).toHaveBeenCalled()
      expect(onPreviewFile).not.toHaveBeenCalled()
    })
  })

  describe('folder node', () => {
    const folderNode: FileNode = {
      id: 'folder-1',
      name: 'docs',
      type: 'folder',
      path: '/docs',
      children: [
        { id: 'file-1', name: 'readme.md', type: 'file', path: '/docs/readme.md' },
        { id: 'file-2', name: 'guide.md', type: 'file', path: '/docs/guide.md' },
      ],
    }

    it('should render folder name', () => {
      render(<FileTreeItem {...defaultProps} node={folderNode} />)

      expect(screen.getByText('docs')).toBeInTheDocument()
    })

    it('should show child count', () => {
      render(<FileTreeItem {...defaultProps} node={folderNode} />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should call onToggleFolder when clicked', () => {
      const onToggleFolder = vi.fn()
      render(
        <FileTreeItem {...defaultProps} node={folderNode} onToggleFolder={onToggleFolder} />
      )

      fireEvent.click(screen.getByText('docs'))

      expect(onToggleFolder).toHaveBeenCalledWith('folder-1')
    })

    it('should show collapsed indicator when folder is collapsed', () => {
      render(<FileTreeItem {...defaultProps} node={folderNode} />)

      expect(screen.getByText('▶')).toBeInTheDocument()
    })

    it('should show expanded indicator when folder is expanded', () => {
      const expandedFolders = new Set(['folder-1'])
      render(
        <FileTreeItem {...defaultProps} node={folderNode} expandedFolders={expandedFolders} />
      )

      expect(screen.getByText('▼')).toBeInTheDocument()
    })

    it('should not render children when collapsed', () => {
      render(<FileTreeItem {...defaultProps} node={folderNode} />)

      expect(screen.queryByText('readme.md')).not.toBeInTheDocument()
      expect(screen.queryByText('guide.md')).not.toBeInTheDocument()
    })

    it('should render children when expanded', () => {
      const expandedFolders = new Set(['folder-1'])
      render(
        <FileTreeItem {...defaultProps} node={folderNode} expandedFolders={expandedFolders} />
      )

      expect(screen.getByText('readme.md')).toBeInTheDocument()
      expect(screen.getByText('guide.md')).toBeInTheDocument()
    })
  })

  describe('status badges', () => {
    it('should show NEW badge for new files', () => {
      const fileNode: FileNode = {
        id: 'file-1',
        name: 'new-file.txt',
        type: 'file',
        path: '/new-file.txt',
        status: 'new',
      }

      render(<FileTreeItem {...defaultProps} node={fileNode} />)

      expect(screen.getByText('NEW')).toBeInTheDocument()
    })

    it('should show MOD badge for modified files', () => {
      const fileNode: FileNode = {
        id: 'file-1',
        name: 'modified.txt',
        type: 'file',
        path: '/modified.txt',
        status: 'modified',
      }

      render(<FileTreeItem {...defaultProps} node={fileNode} />)

      expect(screen.getByText('MOD')).toBeInTheDocument()
    })

    it('should show checkmark for synced files', () => {
      const fileNode: FileNode = {
        id: 'file-1',
        name: 'synced.txt',
        type: 'file',
        path: '/synced.txt',
        status: 'synced',
      }

      render(<FileTreeItem {...defaultProps} node={fileNode} />)

      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    it('should show user icon for user-uploaded files', () => {
      const fileNode: FileNode = {
        id: 'file-1',
        name: 'uploaded.txt',
        type: 'file',
        path: '/uploaded.txt',
        uploadedBy: 'user',
      }

      render(<FileTreeItem {...defaultProps} node={fileNode} />)

      expect(screen.getByTitle('User uploaded')).toBeInTheDocument()
    })
  })

  describe('file icons', () => {
    const testCases = [
      { filename: 'readme.md', expected: '📝' },
      { filename: 'data.json', expected: '📋' },
      { filename: 'app.ts', expected: '🔷' },
      { filename: 'script.js', expected: '🟨' },
      { filename: 'image.png', expected: '🖼️' },
      { filename: 'document.pdf', expected: '📕' },
      { filename: 'styles.css', expected: '🎨' },
      { filename: 'index.html', expected: '🌐' },
      { filename: 'script.py', expected: '🐍' },
      { filename: 'unknown.xyz', expected: '📄' },
    ]

    testCases.forEach(({ filename, expected }) => {
      it(`should show ${expected} icon for ${filename}`, () => {
        const fileNode: FileNode = {
          id: 'file-1',
          name: filename,
          type: 'file',
          path: `/${filename}`,
        }

        render(<FileTreeItem {...defaultProps} node={fileNode} />)

        expect(screen.getByText(expected)).toBeInTheDocument()
      })
    })
  })

  describe('indentation', () => {
    it('should apply depth-based padding', () => {
      const fileNode: FileNode = {
        id: 'file-1',
        name: 'deep.txt',
        type: 'file',
        path: '/a/b/c/deep.txt',
      }

      const { container } = render(
        <FileTreeItem {...defaultProps} node={fileNode} depth={3} />
      )

      const item = container.firstChild as HTMLElement
      // Padding should be: depth * 16 + 8 + 16 (for files) = 3 * 16 + 8 + 16 = 72
      expect(item.style.paddingLeft).toBe('72px')
    })
  })

  describe('nested folders', () => {
    const nestedFolder: FileNode = {
      id: 'folder-1',
      name: 'level1',
      type: 'folder',
      path: '/level1',
      children: [
        {
          id: 'folder-2',
          name: 'level2',
          type: 'folder',
          path: '/level1/level2',
          children: [
            { id: 'file-1', name: 'deep.txt', type: 'file', path: '/level1/level2/deep.txt' },
          ],
        },
      ],
    }

    it('should render nested folders when expanded', () => {
      const expandedFolders = new Set(['folder-1', 'folder-2'])
      render(
        <FileTreeItem
          {...defaultProps}
          node={nestedFolder}
          expandedFolders={expandedFolders}
        />
      )

      expect(screen.getByText('level1')).toBeInTheDocument()
      expect(screen.getByText('level2')).toBeInTheDocument()
      expect(screen.getByText('deep.txt')).toBeInTheDocument()
    })

    it('should not render deeply nested items when parent collapsed', () => {
      const expandedFolders = new Set(['folder-2']) // Only inner folder expanded
      render(
        <FileTreeItem
          {...defaultProps}
          node={nestedFolder}
          expandedFolders={expandedFolders}
        />
      )

      expect(screen.getByText('level1')).toBeInTheDocument()
      expect(screen.queryByText('level2')).not.toBeInTheDocument()
      expect(screen.queryByText('deep.txt')).not.toBeInTheDocument()
    })
  })
})
