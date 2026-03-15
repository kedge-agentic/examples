/**
 * useFileBrowser Hook Tests
 *
 * Tests for file browser state management including:
 * - File tree fetching
 * - Folder toggle
 * - File preview
 * - File download
 * - Real-time updates via WebSocket
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileBrowser } from '../useFileBrowser'
import type { FileNode, FileCreatedEvent } from '../../types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.open
const mockWindowOpen = vi.fn()
global.window.open = mockWindowOpen

// Mock socket
const createMockSocket = () => {
  const listeners: Record<string, Function[]> = {}
  return {
    on: vi.fn((event: string, callback: Function) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(callback)
    }),
    off: vi.fn((event: string, callback: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback)
      }
    }),
    emit: vi.fn(),
    // Helper to simulate receiving events
    simulateEvent: (event: string, data: unknown) => {
      listeners[event]?.forEach(cb => cb(data))
    },
  }
}

describe('useFileBrowser', () => {
  let mockSocket: ReturnType<typeof createMockSocket>

  const mockTreeResponse = {
    tree: [
      {
        id: 'folder-/docs',
        name: 'docs',
        type: 'folder' as const,
        path: '/docs',
        children: [
          {
            id: 'file-uuid-1',
            name: 'readme.md',
            type: 'file' as const,
            path: '/docs/readme.md',
            fileId: 'uuid-1',
            mimeType: 'text/markdown',
            size: 1024,
            status: 'new' as const,
          },
        ],
      },
    ],
  }

  const mockPreviewResponse = {
    content: '# Hello World',
    truncated: false,
    encoding: 'utf8' as const,
    mimeType: 'text/markdown',
    size: 1024,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSocket = createMockSocket()

    // Default successful responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/tree')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTreeResponse),
        })
      }
      if (url.includes('/preview')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPreviewResponse),
        })
      }
      if (url.includes('/sync')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, status: 'synced' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty state when no sessionId', () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: '', socket: null })
      )

      expect(result.current.tree).toEqual([])
      expect(result.current.expandedFolders.size).toBe(0)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.previewFile).toBeNull()
    })

    it('should fetch file tree on mount when sessionId provided', async () => {
      renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/files/session/session-1/tree'),
          expect.any(Object)
        )
      })
    })

    it('should not fetch when sessionId is empty', () => {
      renderHook(() =>
        useFileBrowser({ sessionId: '', socket: null })
      )

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('fetchFileTree', () => {
    it('should update tree state on successful fetch', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.tree).toEqual(mockTreeResponse.tree)
      })
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: Function
      mockFetch.mockImplementation(() => new Promise(resolve => {
        resolvePromise = () => resolve({
          ok: true,
          json: () => Promise.resolve(mockTreeResponse),
        })
      }))

      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      // Initially not loading (before useEffect runs)
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      // Resolve the promise
      await act(async () => {
        resolvePromise!()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should set error state on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.error).toContain('500')
      })
    })
  })

  describe('toggleFolder', () => {
    it('should expand collapsed folder', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      act(() => {
        result.current.toggleFolder('folder-/docs')
      })

      expect(result.current.expandedFolders.has('folder-/docs')).toBe(true)
    })

    it('should collapse expanded folder', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      // Expand first
      act(() => {
        result.current.toggleFolder('folder-/docs')
      })

      expect(result.current.expandedFolders.has('folder-/docs')).toBe(true)

      // Then collapse
      act(() => {
        result.current.toggleFolder('folder-/docs')
      })

      expect(result.current.expandedFolders.has('folder-/docs')).toBe(false)
    })
  })

  describe('openPreview', () => {
    it('should fetch and set preview content', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      const file: FileNode = {
        id: 'file-uuid-1',
        name: 'readme.md',
        type: 'file',
        path: '/docs/readme.md',
        fileId: 'uuid-1',
      }

      await act(async () => {
        await result.current.openPreview(file)
      })

      expect(result.current.previewFile).toEqual(file)
      expect(result.current.previewContent).toEqual(mockPreviewResponse)
    })

    it('should not fetch preview if file has no fileId', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      const file: FileNode = {
        id: 'folder-1',
        name: 'docs',
        type: 'folder',
        path: '/docs',
      }

      await act(async () => {
        await result.current.openPreview(file)
      })

      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/preview'),
        expect.any(Object)
      )
    })

    it('should set previewLoading during fetch', async () => {
      let resolvePromise: Function
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/tree')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTreeResponse),
          })
        }
        return new Promise(resolve => {
          resolvePromise = () => resolve({
            ok: true,
            json: () => Promise.resolve(mockPreviewResponse),
          })
        })
      })

      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      const file: FileNode = {
        id: 'file-1',
        name: 'test.md',
        type: 'file',
        path: '/test.md',
        fileId: 'uuid-1',
      }

      act(() => {
        result.current.openPreview(file)
      })

      await waitFor(() => {
        expect(result.current.previewLoading).toBe(true)
      })

      await act(async () => {
        resolvePromise!()
      })

      await waitFor(() => {
        expect(result.current.previewLoading).toBe(false)
      })
    })
  })

  describe('closePreview', () => {
    it('should clear preview state', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      const file: FileNode = {
        id: 'file-1',
        name: 'test.md',
        type: 'file',
        path: '/test.md',
        fileId: 'uuid-1',
      }

      await act(async () => {
        await result.current.openPreview(file)
      })

      expect(result.current.previewFile).not.toBeNull()

      act(() => {
        result.current.closePreview()
      })

      expect(result.current.previewFile).toBeNull()
      expect(result.current.previewContent).toBeNull()
    })
  })

  describe('downloadFile', () => {
    it('should open file download URL', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      const file: FileNode = {
        id: 'file-1',
        name: 'test.md',
        type: 'file',
        path: '/test.md',
        fileId: 'uuid-1',
      }

      await act(async () => {
        await result.current.downloadFile(file)
      })

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/files/uuid-1/download'),
        '_blank'
      )
    })

    it('should call sync endpoint after download', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      const file: FileNode = {
        id: 'file-1',
        name: 'test.md',
        type: 'file',
        path: '/test.md',
        fileId: 'uuid-1',
        status: 'new',
      }

      await act(async () => {
        await result.current.downloadFile(file)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/files/uuid-1/sync'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should not download file without fileId', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      const file: FileNode = {
        id: 'folder-1',
        name: 'docs',
        type: 'folder',
        path: '/docs',
      }

      await act(async () => {
        await result.current.downloadFile(file)
      })

      expect(mockWindowOpen).not.toHaveBeenCalled()
    })
  })

  describe('real-time updates', () => {
    it('should listen for file_created events when socket provided', () => {
      renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: mockSocket as any })
      )

      expect(mockSocket.on).toHaveBeenCalledWith('file_created', expect.any(Function))
    })

    it('should add new file to tree on file_created event', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: mockSocket as any })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      const fileCreatedEvent: FileCreatedEvent = {
        type: 'file_created',
        payload: {
          id: 'new-uuid',
          filename: 'new-file.txt',
          originalPath: 'new-file.txt',
          mimeType: 'text/plain',
          size: 500,
          status: 'new',
          uploadedBy: 'agent',
          createdAt: new Date().toISOString(),
          sessionId: 'session-1',
          messageId: 'msg-1',
        },
      }

      act(() => {
        mockSocket.simulateEvent('file_created', fileCreatedEvent)
      })

      await waitFor(() => {
        const newFile = result.current.tree.find(
          n => n.name === 'new-file.txt'
        )
        expect(newFile).toBeDefined()
        expect(newFile?.status).toBe('new')
      })
    })

    it('should ignore file_created events for other sessions', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: mockSocket as any })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      const initialTreeLength = result.current.tree.length

      const fileCreatedEvent: FileCreatedEvent = {
        type: 'file_created',
        payload: {
          id: 'other-uuid',
          filename: 'other-file.txt',
          originalPath: 'other-file.txt',
          mimeType: 'text/plain',
          size: 500,
          status: 'new',
          uploadedBy: 'agent',
          createdAt: new Date().toISOString(),
          sessionId: 'other-session', // Different session
          messageId: 'msg-1',
        },
      }

      act(() => {
        mockSocket.simulateEvent('file_created', fileCreatedEvent)
      })

      // Tree should not change
      expect(result.current.tree.length).toBe(initialTreeLength)
    })

    it('should cleanup socket listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: mockSocket as any })
      )

      unmount()

      expect(mockSocket.off).toHaveBeenCalledWith('file_created', expect.any(Function))
    })
  })

  describe('uploadFile', () => {
    it('should upload file without messageId', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      mockFetch.mockClear()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-file-id', filename: 'test.txt' }),
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTreeResponse),
      })

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      await act(async () => {
        await result.current.uploadFile(testFile)
      })

      // Check that fetch was called with FormData
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/files/upload'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      )

      // Verify FormData contains sessionId but not messageId
      const fetchCall = mockFetch.mock.calls.find(call => call[0].includes('/upload'))
      expect(fetchCall).toBeTruthy()
      const formData = fetchCall![1].body as FormData
      expect(formData.get('sessionId')).toBe('session-1')
      expect(formData.get('file')).toBeInstanceOf(File)
    })

    it('should upload file with targetPath', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      mockFetch.mockClear()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-file-id', filename: 'test.txt' }),
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTreeResponse),
      })

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      await act(async () => {
        await result.current.uploadFile(testFile, '/uploads')
      })

      const fetchCall = mockFetch.mock.calls.find(call => call[0].includes('/upload'))
      expect(fetchCall).toBeTruthy()
      const formData = fetchCall![1].body as FormData
      expect(formData.get('targetPath')).toBe('/uploads')
    })

    it('should refresh file tree after upload', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      mockFetch.mockClear()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-file-id', filename: 'test.txt' }),
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTreeResponse),
      })

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      await act(async () => {
        await result.current.uploadFile(testFile)
      })

      // Should have called upload and then tree refresh
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/tree'),
        expect.any(Object)
      )
    })

    it('should throw error on upload failure', async () => {
      const { result } = renderHook(() =>
        useFileBrowser({ sessionId: 'session-1', socket: null })
      )

      await waitFor(() => {
        expect(result.current.tree.length).toBeGreaterThan(0)
      })

      mockFetch.mockClear()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      await expect(
        act(async () => {
          await result.current.uploadFile(testFile)
        })
      ).rejects.toThrow('API error: 400 Bad Request')
    })
  })

  describe('session change', () => {
    it('should reset state when session changes', async () => {
      const { result, rerender } = renderHook(
        ({ sessionId }) => useFileBrowser({ sessionId, socket: null }),
        { initialProps: { sessionId: 'session-1' } }
      )

      // Expand a folder
      act(() => {
        result.current.toggleFolder('folder-/docs')
      })

      expect(result.current.expandedFolders.has('folder-/docs')).toBe(true)

      // Change session
      rerender({ sessionId: 'session-2' })

      await waitFor(() => {
        expect(result.current.expandedFolders.size).toBe(0)
      })
    })

    it('should fetch new tree when session changes', async () => {
      const { rerender } = renderHook(
        ({ sessionId }) => useFileBrowser({ sessionId, socket: null }),
        { initialProps: { sessionId: 'session-1' } }
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('session-1'),
          expect.any(Object)
        )
      })

      mockFetch.mockClear()

      rerender({ sessionId: 'session-2' })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('session-2'),
          expect.any(Object)
        )
      })
    })
  })
})
