/**
 * useSimulatedSession Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSimulatedSession } from '../useSimulatedSession'

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

describe('useSimulatedSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('initializes with preset skills', () => {
    const { result } = renderHook(() => useSimulatedSession())

    expect(result.current.skills).toHaveLength(4)
    expect(result.current.skills.map(s => s.id)).toEqual([
      'hello-world',
      'report',
      'document',
      'analysis',
    ])
  })

  it('initializes with empty session', () => {
    const { result } = renderHook(() => useSimulatedSession())

    expect(result.current.session.messages).toHaveLength(0)
    expect(result.current.session.isProcessing).toBe(false)
    expect(result.current.session.activeSkill).toBe(null)
    expect(result.current.session.needsRestart).toBe(false)
  })

  it('all skills are disabled by default', () => {
    const { result } = renderHook(() => useSimulatedSession())

    expect(result.current.skills.every(s => s.enabled === false)).toBe(true)
  })

  // Toggle skill tests
  describe('toggleSkill', () => {
    it('enables a skill when toggled', () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.toggleSkill('hello-world')
      })

      const skill = result.current.skills.find(s => s.id === 'hello-world')
      expect(skill?.enabled).toBe(true)
    })

    it('disables a skill when toggled again', () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.toggleSkill('hello-world')
      })
      act(() => {
        result.current.toggleSkill('hello-world')
      })

      const skill = result.current.skills.find(s => s.id === 'hello-world')
      expect(skill?.enabled).toBe(false)
    })

    it('sets needsRestart when skill is toggled after messages exist', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      // Enable a skill
      act(() => {
        result.current.toggleSkill('hello-world')
      })

      // Send a message
      act(() => {
        result.current.sendMessage('hello')
      })

      // Fast-forward through streaming
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      // Toggle another skill
      act(() => {
        result.current.toggleSkill('report')
      })

      expect(result.current.session.needsRestart).toBe(true)
    })
  })

  // Restart session tests
  describe('restartSession', () => {
    it('clears needsRestart flag', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      // Enable skill and send message
      act(() => {
        result.current.toggleSkill('hello-world')
      })
      act(() => {
        result.current.sendMessage('hello')
      })
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      // Toggle another skill to set needsRestart
      act(() => {
        result.current.toggleSkill('report')
      })
      expect(result.current.session.needsRestart).toBe(true)

      // Restart
      act(() => {
        result.current.restartSession()
      })

      expect(result.current.session.needsRestart).toBe(false)
    })
  })

  // Send message tests
  describe('sendMessage', () => {
    it('adds user message to session', () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.sendMessage('Hello there')
      })

      expect(result.current.session.messages).toHaveLength(2) // user + assistant
      expect(result.current.session.messages[0]!.role).toBe('user')
      expect(result.current.session.messages[0]!.content).toBe('Hello there')
    })

    it('sets isProcessing to true while streaming', () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.sendMessage('Hello')
      })

      expect(result.current.session.isProcessing).toBe(true)
    })

    it('sets isProcessing to false after streaming completes', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.sendMessage('Hello')
      })

      // Need to run all timers to completion since streaming has variable delays
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.session.isProcessing).toBe(false)
    })

    it('uses hello-world skill when enabled and greeting sent', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.toggleSkill('hello-world')
      })

      act(() => {
        result.current.sendMessage('hello')
      })

      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      const assistantMsg = result.current.session.messages.find(m => m.role === 'assistant')
      expect(assistantMsg?.skill).toBe('hello-world')
      expect(assistantMsg?.files).toBeDefined()
      expect(assistantMsg?.files?.[0]?.name).toBe('hello-world.txt')
    })

    it('uses report skill when enabled and report requested', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.toggleSkill('report')
      })

      act(() => {
        result.current.sendMessage('generate a report')
      })

      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      const assistantMsg = result.current.session.messages.find(m => m.role === 'assistant')
      expect(assistantMsg?.skill).toBe('report')
    })

    it('uses document skill when enabled and document requested', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.toggleSkill('document')
      })

      act(() => {
        result.current.sendMessage('write a document')
      })

      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      const assistantMsg = result.current.session.messages.find(m => m.role === 'assistant')
      expect(assistantMsg?.skill).toBe('document')
    })

    it('uses analysis skill when enabled and analysis requested', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.toggleSkill('analysis')
      })

      act(() => {
        result.current.sendMessage('analyze the data')
      })

      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      const assistantMsg = result.current.session.messages.find(m => m.role === 'assistant')
      expect(assistantMsg?.skill).toBe('analysis')
    })

    it('returns default response when no skill matches', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.sendMessage('random message')
      })

      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      const assistantMsg = result.current.session.messages.find(m => m.role === 'assistant')
      expect(assistantMsg?.skill).toBeUndefined()
      expect(assistantMsg?.files).toBeUndefined()
    })

    it('does not send message while already processing', async () => {
      const { result } = renderHook(() => useSimulatedSession())

      act(() => {
        result.current.sendMessage('first message')
      })

      // Try to send another message while processing
      act(() => {
        result.current.sendMessage('second message')
      })

      // Only one user message should be added
      const userMessages = result.current.session.messages.filter(m => m.role === 'user')
      expect(userMessages).toHaveLength(1)
    })
  })

  // Download file tests
  describe('downloadFile', () => {
    it('creates and downloads a file', () => {
      const { result } = renderHook(() => useSimulatedSession())

      const mockClick = vi.fn()
      const mockElement = { click: mockClick, href: '', download: '' }
      vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any)

      act(() => {
        result.current.downloadFile({
          name: 'hello-world.txt',
          size: 256,
          type: 'text/plain',
        })
      })

      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
      expect(mockElement.download).toBe('hello-world.txt')
    })

    it('generates specific content for hello-world.txt', () => {
      const { result } = renderHook(() => useSimulatedSession())

      // Capture Blob content by replacing Blob after hook is rendered
      let blobContent = ''
      const OriginalBlob = global.Blob
      class MockBlob extends OriginalBlob {
        constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options)
          if (parts && parts.length > 0 && typeof parts[0] === 'string') {
            blobContent = parts[0]
          }
        }
      }
      global.Blob = MockBlob as typeof Blob

      act(() => {
        result.current.downloadFile({
          name: 'hello-world.txt',
          size: 256,
          type: 'text/plain',
        })
      })

      expect(blobContent).toContain('HELLO WORLD')
      expect(blobContent).toContain('CCAAS')

      global.Blob = OriginalBlob
    })

    it('generates generic content for other files', () => {
      const { result } = renderHook(() => useSimulatedSession())

      // Capture Blob content by replacing Blob after hook is rendered
      let blobContent = ''
      const OriginalBlob = global.Blob
      class MockBlob extends OriginalBlob {
        constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options)
          if (parts && parts.length > 0 && typeof parts[0] === 'string') {
            blobContent = parts[0]
          }
        }
      }
      global.Blob = MockBlob as typeof Blob

      act(() => {
        result.current.downloadFile({
          name: 'other-file.md',
          size: 100,
          type: 'text/markdown',
        })
      })

      expect(blobContent).toContain('# other-file.md')
      expect(blobContent).toContain('simulated content')

      global.Blob = OriginalBlob
    })
  })
})
