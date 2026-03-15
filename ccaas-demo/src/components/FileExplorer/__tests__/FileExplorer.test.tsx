import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileExplorer } from '../FileExplorer'

// Mock hooks
vi.mock('../../../hooks/useWorkspaceFiles', () => ({
  useWorkspaceFiles: vi.fn(),
}))

vi.mock('../../../hooks/useFileDownload', () => ({
  useFileDownload: vi.fn(),
}))

import { useWorkspaceFiles } from '../../../hooks/useWorkspaceFiles'
import { useFileDownload } from '../../../hooks/useFileDownload'

describe('FileExplorer', () => {
  const mockTree = [
    {
      id: 'folder-1',
      name: 'scripts',
      type: 'folder' as const,
      path: 'scripts',
      children: [
        {
          id: 'file-1',
          name: 'intro.md',
          type: 'file' as const,
          path: 'scripts/intro.md',
          size: 512,
        },
      ],
    },
    {
      id: 'file-2',
      name: 'test.txt',
      type: 'file' as const,
      path: 'test.txt',
      size: 1024,
    },
  ]

  const mockRefetch = vi.fn()
  const mockDownloadFile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useWorkspaceFiles).mockReturnValue({
      tree: mockTree,
      loading: false,
      error: null,
      refetch: mockRefetch,
    })

    vi.mocked(useFileDownload).mockReturnValue({
      downloadFile: mockDownloadFile,
      downloading: new Set(),
    })
  })

  it('displays file tree after loading', async () => {
    render(<FileExplorer sessionId="session-123" />)

    await waitFor(() => {
      expect(screen.getByText('scripts')).toBeInTheDocument()
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    vi.mocked(useWorkspaceFiles).mockReturnValue({
      tree: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
    })

    render(<FileExplorer sessionId="session-123" />)

    expect(screen.getByText('Loading files...')).toBeInTheDocument()
  })

  it('shows error state with retry button', () => {
    vi.mocked(useWorkspaceFiles).mockReturnValue({
      tree: [],
      loading: false,
      error: 'Network error',
      refetch: mockRefetch,
    })

    render(<FileExplorer sessionId="session-123" />)

    expect(screen.getByText('Failed to load files')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()

    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('filters files by search query', async () => {
    render(<FileExplorer sessionId="session-123" />)

    const searchInput = screen.getByPlaceholderText('Search files...')
    fireEvent.change(searchInput, { target: { value: 'intro' } })

    await waitFor(() => {
      // Folder containing matching file should be present
      expect(screen.getByText('scripts')).toBeInTheDocument()
      // Non-matching file should not be present
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument()
    })

    // Expand the folder to see the matching child
    const folderButton = screen.getByText('scripts')
    fireEvent.click(folderButton)

    await waitFor(() => {
      expect(screen.getByText('intro.md')).toBeInTheDocument()
    })
  })

  it('calls downloadFile when file is clicked', async () => {
    mockDownloadFile.mockResolvedValue(undefined)

    render(<FileExplorer sessionId="session-123" />)

    const fileButton = screen.getByText('test.txt')
    fireEvent.click(fileButton)

    await waitFor(() => {
      expect(mockDownloadFile).toHaveBeenCalledWith('session-123', 'test.txt', 'test.txt')
    })
  })

  it('expands folder when clicked', async () => {
    render(<FileExplorer sessionId="session-123" />)

    const folderButton = screen.getByText('scripts')
    fireEvent.click(folderButton)

    await waitFor(() => {
      expect(screen.getByText('intro.md')).toBeInTheDocument()
    })
  })

  it('calls refresh when refresh button is clicked', () => {
    render(<FileExplorer sessionId="session-123" />)

    const refreshButton = screen.getByLabelText('Refresh file tree')
    fireEvent.click(refreshButton)

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('changes sort order', async () => {
    render(<FileExplorer sessionId="session-123" />)

    const sortSelect = screen.getByLabelText('Sort by')
    fireEvent.change(sortSelect, { target: { value: 'size' } })

    await waitFor(() => {
      expect(sortSelect).toHaveValue('size')
    })
  })

  it('expands all folders', async () => {
    render(<FileExplorer sessionId="session-123" />)

    const expandAllButton = screen.getByText('Expand All')
    fireEvent.click(expandAllButton)

    await waitFor(() => {
      expect(screen.getByText('intro.md')).toBeInTheDocument()
    })
  })

  it('collapses all folders', async () => {
    render(<FileExplorer sessionId="session-123" />)

    // First expand
    const expandAllButton = screen.getByText('Expand All')
    fireEvent.click(expandAllButton)

    await waitFor(() => {
      expect(screen.getByText('intro.md')).toBeInTheDocument()
    })

    // Then collapse
    const collapseAllButton = screen.getByText('Collapse All')
    fireEvent.click(collapseAllButton)

    await waitFor(() => {
      expect(screen.queryByText('intro.md')).not.toBeInTheDocument()
    })
  })

  it('shows download status when downloading', () => {
    vi.mocked(useFileDownload).mockReturnValue({
      downloadFile: mockDownloadFile,
      downloading: new Set(['session-123:test.txt']),
    })

    render(<FileExplorer sessionId="session-123" />)

    expect(screen.getByText(/Downloading 1 file/)).toBeInTheDocument()
  })

  it('calls onFileSelect callback when provided', async () => {
    const onFileSelect = vi.fn()
    mockDownloadFile.mockResolvedValue(undefined)

    render(<FileExplorer sessionId="session-123" onFileSelect={onFileSelect} />)

    const fileButton = screen.getByText('test.txt')
    fireEvent.click(fileButton)

    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test.txt',
          type: 'file',
        })
      )
    })
  })

  it('handles download errors', async () => {
    mockDownloadFile.mockRejectedValue(new Error('Download failed'))
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<FileExplorer sessionId="session-123" />)

    const fileButton = screen.getByText('test.txt')
    fireEvent.click(fileButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to download test.txt')
    })

    alertSpy.mockRestore()
  })
})
