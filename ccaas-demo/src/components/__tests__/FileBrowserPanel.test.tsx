/**
 * FileBrowserPanel Component Tests
 *
 * Tests for the main file browser panel including:
 * - Rendering with files
 * - Collapse/expand functionality
 * - File count badges
 * - Loading and error states
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileBrowserPanel } from '../FileBrowserPanel'
import type { FileNode } from '../../types'

describe('FileBrowserPanel', () => {
  const mockTree: FileNode[] = [
    {
      id: 'folder-/docs',
      name: 'docs',
      type: 'folder',
      path: '/docs',
      children: [
        {
          id: 'file-1',
          name: 'readme.md',
          type: 'file',
          path: '/docs/readme.md',
          fileId: 'uuid-1',
          mimeType: 'text/markdown',
          size: 1024,
          status: 'new',
        },
      ],
    },
    {
      id: 'file-2',
      name: 'config.json',
      type: 'file',
      path: '/config.json',
      fileId: 'uuid-2',
      mimeType: 'application/json',
      size: 256,
      status: 'synced',
    },
  ]

  const defaultProps = {
    tree: mockTree,
    expandedFolders: new Set<string>(),
    loading: false,
    error: null,
    previewFile: null,
    previewContent: null,
    previewLoading: false,
    collapsed: false,
    onToggleCollapse: vi.fn(),
    onToggleFolder: vi.fn(),
    onPreviewFile: vi.fn(),
    onClosePreview: vi.fn(),
    onDownloadFile: vi.fn(),
    onRefresh: vi.fn(),
  }

  describe('rendering', () => {
    it('should render header with Files title', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      expect(screen.getByText('Files')).toBeInTheDocument()
    })

    it('should show total file count', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      // 2 files total (readme.md + config.json)
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should show NEW badge with count', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      expect(screen.getByText('1 NEW')).toBeInTheDocument()
    })

    it('should render file tree items', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      expect(screen.getByText('docs')).toBeInTheDocument()
      expect(screen.getByText('config.json')).toBeInTheDocument()
    })
  })

  describe('collapsed state', () => {
    it('should render minimal UI when collapsed', () => {
      render(<FileBrowserPanel {...defaultProps} collapsed={true} />)

      // Should not show full header
      expect(screen.queryByText('Files')).not.toBeInTheDocument()

      // Should show file icon
      expect(screen.getByTitle('Expand File Browser')).toBeInTheDocument()
    })

    it('should show new files badge when collapsed', () => {
      render(<FileBrowserPanel {...defaultProps} collapsed={true} />)

      // Should show badge with new file count
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should call onToggleCollapse when expand button clicked', () => {
      const onToggleCollapse = vi.fn()
      render(
        <FileBrowserPanel
          {...defaultProps}
          collapsed={true}
          onToggleCollapse={onToggleCollapse}
        />
      )

      fireEvent.click(screen.getByTitle('Expand File Browser'))

      expect(onToggleCollapse).toHaveBeenCalledTimes(1)
    })
  })

  describe('loading state', () => {
    it('should show loading indicator when loading with empty tree', () => {
      render(<FileBrowserPanel {...defaultProps} tree={[]} loading={true} />)

      expect(screen.getByText(/Loading files/)).toBeInTheDocument()
    })

    it('should show tree when loading with existing data', () => {
      render(<FileBrowserPanel {...defaultProps} loading={true} />)

      expect(screen.getByText('docs')).toBeInTheDocument()
    })

    it('should disable refresh button when loading', () => {
      render(<FileBrowserPanel {...defaultProps} loading={true} />)

      const refreshButton = screen.getByTitle('Refresh')
      expect(refreshButton).toBeDisabled()
    })
  })

  describe('error state', () => {
    it('should show error banner when error exists', () => {
      render(
        <FileBrowserPanel {...defaultProps} error="Failed to load files" />
      )

      expect(screen.getByText('Failed to load files')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state when tree is empty', () => {
      render(<FileBrowserPanel {...defaultProps} tree={[]} />)

      expect(screen.getByText('No files yet')).toBeInTheDocument()
      expect(screen.getByText(/Drag and drop/)).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onToggleCollapse when collapse button clicked', () => {
      const onToggleCollapse = vi.fn()
      render(
        <FileBrowserPanel {...defaultProps} onToggleCollapse={onToggleCollapse} />
      )

      fireEvent.click(screen.getByTitle('Collapse'))

      expect(onToggleCollapse).toHaveBeenCalledTimes(1)
    })

    it('should call onRefresh when refresh button clicked', () => {
      const onRefresh = vi.fn()
      render(<FileBrowserPanel {...defaultProps} onRefresh={onRefresh} />)

      fireEvent.click(screen.getByTitle('Refresh'))

      expect(onRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('file counts', () => {
    it('should count nested files correctly', () => {
      const deepTree: FileNode[] = [
        {
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
                { id: 'file-1', name: 'deep.txt', type: 'file', path: '/level1/level2/deep.txt', status: 'new' },
                { id: 'file-2', name: 'deep2.txt', type: 'file', path: '/level1/level2/deep2.txt', status: 'new' },
              ],
            },
            { id: 'file-3', name: 'mid.txt', type: 'file', path: '/level1/mid.txt', status: 'synced' },
          ],
        },
      ]

      render(<FileBrowserPanel {...defaultProps} tree={deepTree} />)

      // 3 files total
      expect(screen.getByText('3')).toBeInTheDocument()
      // 2 new files
      expect(screen.getByText('2 NEW')).toBeInTheDocument()
    })

    it('should not show NEW badge when no new files', () => {
      const allSyncedTree: FileNode[] = [
        { id: 'file-1', name: 'file1.txt', type: 'file', path: '/file1.txt', status: 'synced' },
        { id: 'file-2', name: 'file2.txt', type: 'file', path: '/file2.txt', status: 'synced' },
      ]

      render(<FileBrowserPanel {...defaultProps} tree={allSyncedTree} />)

      expect(screen.queryByText(/NEW/)).not.toBeInTheDocument()
    })
  })

  describe('uploading state', () => {
    it('should show uploading indicator when uploading is true', () => {
      render(<FileBrowserPanel {...defaultProps} uploading={true} />)

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })

    it('should not show uploading indicator when uploading is false', () => {
      render(<FileBrowserPanel {...defaultProps} uploading={false} />)

      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()
    })

    it('should not show uploading indicator by default', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    const createDragEvent = (type: string, files: File[] = []) => {
      const event = new Event(type, { bubbles: true })
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          files,
          items: files.map(f => ({ kind: 'file', getAsFile: () => f })),
          types: ['Files'],
        },
      })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('should show drop zone indicator on drag over', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      const panel = screen.getByText('Files').closest('div')?.parentElement
      expect(panel).toBeTruthy()

      fireEvent.dragOver(panel!)

      expect(screen.getByText('Drop files here to upload')).toBeInTheDocument()
    })

    it('should hide drop zone indicator on drag leave', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      const panel = screen.getByText('Files').closest('div')?.parentElement
      expect(panel).toBeTruthy()

      // First drag over to show indicator
      fireEvent.dragOver(panel!)
      expect(screen.getByText('Drop files here to upload')).toBeInTheDocument()

      // Then drag leave to hide it
      fireEvent.dragLeave(panel!)
      expect(screen.queryByText('Drop files here to upload')).not.toBeInTheDocument()
    })

    it('should call onUploadFiles when files are dropped', async () => {
      const onUploadFiles = vi.fn().mockResolvedValue(undefined)
      render(<FileBrowserPanel {...defaultProps} onUploadFiles={onUploadFiles} />)

      const panel = screen.getByText('Files').closest('div')?.parentElement
      expect(panel).toBeTruthy()

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const dropEvent = createDragEvent('drop', [testFile])

      fireEvent(panel!, dropEvent)

      expect(onUploadFiles).toHaveBeenCalledTimes(1)
      expect(onUploadFiles).toHaveBeenCalledWith([testFile])
    })

    it('should call onUploadFiles with multiple files', async () => {
      const onUploadFiles = vi.fn().mockResolvedValue(undefined)
      render(<FileBrowserPanel {...defaultProps} onUploadFiles={onUploadFiles} />)

      const panel = screen.getByText('Files').closest('div')?.parentElement
      expect(panel).toBeTruthy()

      const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' })
      const dropEvent = createDragEvent('drop', [file1, file2])

      fireEvent(panel!, dropEvent)

      expect(onUploadFiles).toHaveBeenCalledTimes(1)
      expect(onUploadFiles).toHaveBeenCalledWith([file1, file2])
    })

    it('should not call onUploadFiles when no files are dropped', () => {
      const onUploadFiles = vi.fn().mockResolvedValue(undefined)
      render(<FileBrowserPanel {...defaultProps} onUploadFiles={onUploadFiles} />)

      const panel = screen.getByText('Files').closest('div')?.parentElement
      expect(panel).toBeTruthy()

      const dropEvent = createDragEvent('drop', [])

      fireEvent(panel!, dropEvent)

      expect(onUploadFiles).not.toHaveBeenCalled()
    })

    it('should not error when onUploadFiles is not provided', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      const panel = screen.getByText('Files').closest('div')?.parentElement
      expect(panel).toBeTruthy()

      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const dropEvent = createDragEvent('drop', [testFile])

      // Should not throw
      expect(() => fireEvent(panel!, dropEvent)).not.toThrow()
    })

    it('should hide drop zone indicator after drop', () => {
      const onUploadFiles = vi.fn().mockResolvedValue(undefined)
      render(<FileBrowserPanel {...defaultProps} onUploadFiles={onUploadFiles} />)

      const panel = screen.getByText('Files').closest('div')?.parentElement
      expect(panel).toBeTruthy()

      // Drag over to show indicator
      fireEvent.dragOver(panel!)
      expect(screen.getByText('Drop files here to upload')).toBeInTheDocument()

      // Drop file
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const dropEvent = createDragEvent('drop', [testFile])
      fireEvent(panel!, dropEvent)

      // Indicator should be hidden
      expect(screen.queryByText('Drop files here to upload')).not.toBeInTheDocument()
    })
  })

  describe('click to upload', () => {
    it('should have an upload button in header', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      const uploadButton = screen.getByTitle('Upload files')
      expect(uploadButton).toBeInTheDocument()
    })

    it('should have a hidden file input', () => {
      render(<FileBrowserPanel {...defaultProps} />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveClass('hidden')
    })

    it('should call onUploadFiles when files are selected via input', () => {
      const onUploadFiles = vi.fn().mockResolvedValue(undefined)
      render(<FileBrowserPanel {...defaultProps} onUploadFiles={onUploadFiles} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(onUploadFiles).toHaveBeenCalledWith([testFile])
    })

    it('should disable upload button when uploading', () => {
      render(<FileBrowserPanel {...defaultProps} uploading={true} />)

      const uploadButton = screen.getByTitle('Upload files')
      expect(uploadButton).toBeDisabled()
    })
  })
})
