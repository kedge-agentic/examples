/**
 * App Component Tests
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import type { Skill } from '../types'

// Mock scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Mock useRealSession hook
const mockToggleSkill = vi.fn()
const mockRestartSession = vi.fn()
const mockSendMessage = vi.fn()
const mockDownloadFile = vi.fn()
const mockRefreshSkills = vi.fn()
const mockCreateSkill = vi.fn()
const mockUpdateSkill = vi.fn()
const mockDeleteSkill = vi.fn()
const mockGetSkillDetails = vi.fn()

const defaultMockState: {
  skills: Skill[]
  session: {
    sessionId: string
    messages: never[]
    activeSkill: null
    needsRestart: boolean
    isProcessing: boolean
  }
  connected: boolean
  error: string | null
  loading: boolean
  socket: null
  toggleSkill: typeof mockToggleSkill
  restartSession: typeof mockRestartSession
  sendMessage: typeof mockSendMessage
  downloadFile: typeof mockDownloadFile
  refreshSkills: typeof mockRefreshSkills
  createSkill: typeof mockCreateSkill
  updateSkill: typeof mockUpdateSkill
  deleteSkill: typeof mockDeleteSkill
  getSkillDetails: typeof mockGetSkillDetails
} = {
  skills: [],
  session: {
    sessionId: 'test-session-123456',
    messages: [],
    activeSkill: null,
    needsRestart: false,
    isProcessing: false,
  },
  connected: true,
  error: null,
  loading: false,
  socket: null,
  toggleSkill: mockToggleSkill,
  restartSession: mockRestartSession,
  sendMessage: mockSendMessage,
  downloadFile: mockDownloadFile,
  refreshSkills: mockRefreshSkills,
  createSkill: mockCreateSkill,
  updateSkill: mockUpdateSkill,
  deleteSkill: mockDeleteSkill,
  getSkillDetails: mockGetSkillDetails,
}

let mockState = { ...defaultMockState }

vi.mock('../hooks/useRealSession', () => ({
  useRealSession: () => mockState,
}))

// Mock useFileBrowser hook
vi.mock('../hooks/useFileBrowser', () => ({
  useFileBrowser: () => ({
    tree: [],
    expandedFolders: new Set<string>(),
    loading: false,
    error: null,
    previewFile: null,
    previewContent: null,
    previewLoading: false,
    fetchFileTree: vi.fn(),
    toggleFolder: vi.fn(),
    openPreview: vi.fn(),
    closePreview: vi.fn(),
    downloadFile: vi.fn(),
    uploadFile: vi.fn(),
  }),
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState = { ...defaultMockState }
    mockGetSkillDetails.mockResolvedValue({
      id: 'skill-1',
      name: 'Test Skill',
      content: '# Test Content',
    })
    mockCreateSkill.mockResolvedValue(undefined)
    mockUpdateSkill.mockResolvedValue(undefined)
    mockDeleteSkill.mockResolvedValue(undefined)
  })

  it('renders the app header', () => {
    render(<App />)
    expect(screen.getByText('CCAAS Demo')).toBeInTheDocument()
    expect(screen.getByText('Claude Code as a Service')).toBeInTheDocument()
  })

  it('shows connected status when connected', () => {
    mockState.connected = true
    render(<App />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows disconnected status when not connected', () => {
    mockState.connected = false
    render(<App />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it('displays session ID in header', () => {
    render(<App />)
    expect(screen.getByText('test-session-123...')).toBeInTheDocument()
  })

  // Error handling
  describe('error handling', () => {
    it('shows error banner when there is an error', () => {
      mockState.error = 'Connection failed'
      render(<App />)
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })

    it('shows reload button in error banner', () => {
      mockState.error = 'Something went wrong'
      render(<App />)
      expect(screen.getByText('重新加载')).toBeInTheDocument()
    })
  })

  // Loading state
  describe('loading state', () => {
    it('shows loading banner when loading with no skills', () => {
      mockState.loading = true
      mockState.skills = []
      render(<App />)
      expect(screen.getByText('正在从后端加载 Skills...')).toBeInTheDocument()
    })

    it('does not show loading banner when loading with existing skills', () => {
      mockState.loading = true
      mockState.skills = [
        {
          id: 'skill-1',
          name: 'Test Skill',
          icon: '⚡',
          description: 'A test skill',
          enabled: false,
        },
      ] as Skill[]
      render(<App />)
      expect(screen.queryByText('正在从后端加载 Skills...')).not.toBeInTheDocument()
    })

    it('disables refresh button when loading', () => {
      mockState.loading = true
      render(<App />)
      const refreshButton = screen.getByText('加载中...')
      expect(refreshButton).toBeDisabled()
    })
  })

  // No skills warning
  describe('no skills warning', () => {
    it('shows no skills warning when connected with no skills and not loading', () => {
      mockState.connected = true
      mockState.loading = false
      mockState.skills = []
      render(<App />)
      expect(screen.getByText(/没有找到 Skills/)).toBeInTheDocument()
    })

    it('does not show no skills warning when loading', () => {
      mockState.connected = true
      mockState.loading = true
      mockState.skills = []
      render(<App />)
      expect(screen.queryByText(/没有找到 Skills/)).not.toBeInTheDocument()
    })

    it('does not show no skills warning when disconnected', () => {
      mockState.connected = false
      mockState.loading = false
      mockState.skills = []
      render(<App />)
      expect(screen.queryByText(/没有找到 Skills/)).not.toBeInTheDocument()
    })
  })

  // Refresh skills
  describe('refresh skills', () => {
    it('calls refreshSkills when refresh button is clicked', () => {
      render(<App />)
      const refreshButton = screen.getByText('🔄 刷新 Skills')
      fireEvent.click(refreshButton)
      expect(mockRefreshSkills).toHaveBeenCalled()
    })
  })

  // Sidebar collapse
  describe('sidebar collapse', () => {
    it('toggles sidebar collapse when collapse button is clicked', () => {
      mockState.skills = [
        {
          id: 'skill-1',
          name: 'Test Skill',
          icon: '⚡',
          description: 'A test skill',
          enabled: false,
        },
      ] as Skill[]
      render(<App />)

      // Find collapse button by its title
      const collapseButton = screen.getByTitle('Collapse sidebar')
      fireEvent.click(collapseButton)

      // After collapse, button title should change to Expand
      expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument()
    })
  })

  // Skill management
  describe('skill management', () => {
    beforeEach(() => {
      mockState.skills = [
        {
          id: 'skill-1',
          name: 'Test Skill',
          icon: '⚡',
          description: 'A test skill',
          enabled: false,
        },
      ] as Skill[]
    })

    it('opens editor when add skill button is clicked', () => {
      render(<App />)
      const addButton = screen.getByTitle('Add new skill')
      fireEvent.click(addButton)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('opens editor with skill data when edit is clicked', async () => {
      render(<App />)

      // Trigger hover to show edit button by clicking on the skill card first
      const skillCard = screen.getByText('Test Skill').closest('div')
      if (skillCard) {
        fireEvent.mouseEnter(skillCard.parentElement!)
      }

      // Find and click edit button
      const editButton = await screen.findByTitle('Edit skill')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(mockGetSkillDetails).toHaveBeenCalledWith('skill-1')
      })
    })

    it('opens delete dialog when delete is clicked', async () => {
      render(<App />)

      // Trigger hover to show delete button
      const skillCard = screen.getByText('Test Skill').closest('div')
      if (skillCard) {
        fireEvent.mouseEnter(skillCard.parentElement!)
      }

      // Find and click delete button
      const deleteButton = await screen.findByTitle('Delete skill')
      fireEvent.click(deleteButton)

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
    })

    it('calls deleteSkill when delete is confirmed', async () => {
      render(<App />)

      // Trigger hover to show delete button
      const skillCard = screen.getByText('Test Skill').closest('div')
      if (skillCard) {
        fireEvent.mouseEnter(skillCard.parentElement!)
      }

      // Open delete dialog
      const deleteButton = await screen.findByTitle('Delete skill')
      fireEvent.click(deleteButton)

      // Click confirm - find the Delete button in the dialog
      const confirmButtons = screen.getAllByText('Delete')
      const confirmButton = confirmButtons.find(btn => btn.closest('[role="alertdialog"]'))
      fireEvent.click(confirmButton!)

      await waitFor(() => {
        expect(mockDeleteSkill).toHaveBeenCalledWith('skill-1')
      })
    })

    it('calls toggleSkill when skill card is clicked', () => {
      render(<App />)

      // Click on the skill toggle area (not on edit/delete buttons)
      const skillName = screen.getByText('Test Skill')
      const toggleArea = skillName.closest('[class*="cursor-pointer"]')
      fireEvent.click(toggleArea!)

      expect(mockToggleSkill).toHaveBeenCalledWith('skill-1')
    })
  })

  // Chat interaction
  describe('chat interaction', () => {
    it('renders chat panel', () => {
      render(<App />)
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
    })

    it('calls sendMessage when message is submitted', () => {
      render(<App />)

      const input = screen.getByPlaceholderText('Type a message...')
      fireEvent.change(input, { target: { value: 'Hello' } })
      fireEvent.submit(input.closest('form')!)

      expect(mockSendMessage).toHaveBeenCalledWith('Hello')
    })
  })

  // Session restart
  describe('session restart', () => {
    it('shows restart banner when needsRestart is true', () => {
      mockState.session = {
        ...mockState.session,
        needsRestart: true,
      }
      mockState.skills = [
        {
          id: 'skill-1',
          name: 'Test Skill',
          icon: '⚡',
          description: 'A test skill',
          enabled: false,
        },
      ] as Skill[]
      render(<App />)

      expect(screen.getByText('Skills Updated')).toBeInTheDocument()
    })

    it('calls restartSession when restart button is clicked', () => {
      mockState.session = {
        ...mockState.session,
        needsRestart: true,
      }
      mockState.skills = [
        {
          id: 'skill-1',
          name: 'Test Skill',
          icon: '⚡',
          description: 'A test skill',
          enabled: false,
        },
      ] as Skill[]
      render(<App />)

      const restartButton = screen.getByText('Restart Session')
      fireEvent.click(restartButton)

      expect(mockRestartSession).toHaveBeenCalled()
    })
  })
})
