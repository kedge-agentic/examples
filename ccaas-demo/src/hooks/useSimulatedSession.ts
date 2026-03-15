/**
 * Simulated Session Hook
 *
 * Simulates CCAAS protocol-driven interactions without a backend.
 * Demonstrates skill routing, streaming text, and file creation.
 */

import { useState, useCallback, useRef } from 'react'
import type { Skill, Message, FileInfo, SessionState } from '../types'

// Preset skills
const PRESET_SKILLS: Skill[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    icon: '👋',
    description: 'A simple greeting skill for demonstration',
    enabled: false,
    header: {
      whenToUse: 'When users send greetings or say hello',
      objective: 'Respond with a friendly, personalized greeting',
      triggers: ['hello', 'hi', 'hey', 'greetings', '你好'],
    },
  },
  {
    id: 'report',
    name: 'Report Generator',
    icon: '📊',
    description: 'Generate formatted reports from data',
    enabled: false,
    header: {
      whenToUse: 'When users request reports, summaries, or data exports',
      objective: 'Create well-structured reports with charts and analysis',
      triggers: ['report', 'generate', 'summary', 'export'],
    },
  },
  {
    id: 'document',
    name: 'Document Writer',
    icon: '📝',
    description: 'Write and format documents',
    enabled: false,
    header: {
      whenToUse: 'When users need to create professional documents',
      objective: 'Draft well-formatted documents with proper structure',
      triggers: ['document', 'write', 'draft', 'proposal'],
    },
  },
  {
    id: 'analysis',
    name: 'Data Analyzer',
    icon: '🔍',
    description: 'Analyze data and generate insights',
    enabled: false,
    header: {
      whenToUse: 'When users want to analyze data or find patterns',
      objective: 'Provide statistical analysis and actionable insights',
      triggers: ['analyze', 'analysis', 'insights', 'patterns'],
    },
  },
]

interface SimulatedResponse {
  text: string
  skill: string | null
  files: FileInfo[] | null
  thinkingSteps: string[]
}

function generateResponse(
  message: string,
  enabledSkills: string[],
): SimulatedResponse {
  const lowerMessage = message.toLowerCase()

  // Check for hello-world skill first
  if (enabledSkills.includes('hello-world') &&
      (lowerMessage.includes('hello') || lowerMessage.includes('hi') ||
       lowerMessage.includes('hey') || lowerMessage.includes('你好') ||
       lowerMessage.includes('greetings'))) {
    return {
      text: "👋 Hello there! I'm your friendly CCAAS assistant!\n\nI've created a special Hello World file just for you! This demonstrates how skills can generate files that you can download.\n\nThe file contains:\n- A friendly greeting\n- Current timestamp\n- A simple code example\n\nClick the download button below to get your personalized Hello World file!",
      skill: 'hello-world',
      files: [{
        name: 'hello-world.txt',
        size: 256,
        type: 'text/plain',
      }],
      thinkingSteps: [
        'Recognizing greeting pattern...',
        'Activating Hello World skill...',
        'Generating Hello World file...',
      ],
    }
  }

  // Check for skill-specific triggers
  if (enabledSkills.includes('report') &&
      (lowerMessage.includes('report') || lowerMessage.includes('generate'))) {
    return {
      text: "I'll use the Report Generator skill to create your report. Let me analyze the data and format it for you...\n\nI've created a comprehensive sales report with the following sections:\n- Executive Summary\n- Monthly Performance Metrics\n- Product Category Breakdown\n- Regional Analysis\n- Recommendations\n\nThe report includes charts and visualizations for better understanding.",
      skill: 'report',
      files: [{
        name: 'sales-report-2025-01.md',
        size: 24064,
        type: 'text/markdown',
      }],
      thinkingSteps: [
        'Analyzing the request for report generation...',
        'Gathering relevant data points...',
        'Structuring the report format...',
        'Generating visualizations...',
      ],
    }
  }

  if (enabledSkills.includes('document') &&
      (lowerMessage.includes('document') || lowerMessage.includes('write'))) {
    return {
      text: "I'll use the Document Writer skill to help you create this document. Here's what I've prepared:\n\nI've drafted a professional document with proper formatting, headers, and structure. The document follows best practices for readability and includes:\n- Clear section headers\n- Bullet points for key information\n- Professional formatting",
      skill: 'document',
      files: [{
        name: 'document-draft.docx',
        size: 15565,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }],
      thinkingSteps: [
        'Understanding document requirements...',
        'Choosing appropriate structure...',
        'Drafting content...',
      ],
    }
  }

  if (enabledSkills.includes('analysis') &&
      (lowerMessage.includes('analyze') || lowerMessage.includes('analysis'))) {
    return {
      text: "I'll use the Data Analyzer skill to examine your data. Based on my analysis:\n\n**Key Findings:**\n- Pattern A: Increasing trend in Q4\n- Pattern B: Strong correlation between X and Y\n- Anomaly detected in dataset row 47\n\n**Recommendations:**\n1. Focus resources on high-performing segments\n2. Investigate the anomaly for potential issues\n3. Consider seasonal adjustments",
      skill: 'analysis',
      files: [{
        name: 'analysis-results.json',
        size: 8909,
        type: 'application/json',
      }],
      thinkingSteps: [
        'Loading data for analysis...',
        'Running statistical analysis...',
        'Identifying patterns...',
        'Generating insights...',
      ],
    }
  }

  // Default response without skill
  return {
    text: "I'm here to help! I can assist with various tasks. You can enable skills in the sidebar to unlock additional capabilities:\n\n- **Report Generator**: Create formatted reports\n- **Document Writer**: Write professional documents\n- **Data Analyzer**: Analyze data and find insights\n\nTry saying something like \"generate a report\" or \"analyze this data\" after enabling the relevant skill.",
    skill: null,
    files: null,
    thinkingSteps: [],
  }
}

export function useSimulatedSession() {
  const [skills, setSkills] = useState<Skill[]>(PRESET_SKILLS)
  const [session, setSession] = useState<SessionState>({
    sessionId: `demo-session-${Date.now()}`,
    messages: [],
    activeSkill: null,
    needsRestart: false,
    isProcessing: false,
  })

  const streamingRef = useRef<boolean>(false)

  // Track which skills were enabled when session was last "restarted"
  const restartedWithSkills = useRef<string[]>([])

  const toggleSkill = useCallback((skillId: string) => {
    setSkills(prev => {
      const updated = prev.map(s =>
        s.id === skillId ? { ...s, enabled: !s.enabled } : s
      )

      // Check if any skill changed from what was "restarted" with
      const enabledNow = updated.filter(s => s.enabled).map(s => s.id)
      const isDifferent =
        enabledNow.length !== restartedWithSkills.current.length ||
        enabledNow.some(id => !restartedWithSkills.current.includes(id))

      if (isDifferent && session.messages.length > 0) {
        setSession(prev => ({ ...prev, needsRestart: true }))
      }

      return updated
    })
  }, [session.messages.length])

  const restartSession = useCallback(() => {
    const enabledNow = skills.filter(s => s.enabled).map(s => s.id)
    restartedWithSkills.current = enabledNow

    setSession(prev => ({
      ...prev,
      needsRestart: false,
    }))
  }, [skills])

  const sendMessage = useCallback(async (content: string) => {
    if (streamingRef.current) return

    // Get currently effective skills (skills that were enabled at last restart)
    const effectiveSkills = session.needsRestart
      ? restartedWithSkills.current
      : skills.filter(s => s.enabled).map(s => s.id)

    // If this is first message after enabling skills, record them
    if (session.messages.length === 0) {
      restartedWithSkills.current = skills.filter(s => s.enabled).map(s => s.id)
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isProcessing: true,
    }))

    streamingRef.current = true

    // Generate response
    const response = generateResponse(content, effectiveSkills)

    // Create assistant message
    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      skill: response.skill || undefined,
      files: response.files || undefined,
      status: 'streaming',
      timestamp: new Date(),
    }

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
      activeSkill: response.skill,
    }))

    // Simulate streaming text
    const words = response.text.split(' ')
    let accumulated = ''

    for (let i = 0; i < words.length; i++) {
      await delay(30 + Math.random() * 50)
      accumulated += (i > 0 ? ' ' : '') + words[i]

      setSession(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === assistantMessage.id
            ? { ...m, content: accumulated }
            : m
        ),
      }))
    }

    // Mark as complete
    await delay(100)
    setSession(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.id === assistantMessage.id
          ? { ...m, status: 'complete' }
          : m
      ),
      activeSkill: null,
      isProcessing: false,
    }))

    streamingRef.current = false
  }, [skills, session.messages.length, session.needsRestart])

  const downloadFile = useCallback((file: FileInfo) => {
    // Generate file content based on file name
    let content: string

    if (file.name === 'hello-world.txt') {
      const timestamp = new Date().toISOString()
      content = `╔════════════════════════════════════════╗
║         🌍 HELLO WORLD! 👋              ║
╚════════════════════════════════════════╝

Welcome to Claude Code as a Service (CCAAS)!

This file was generated by the Hello World skill.
Generated at: ${timestamp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example Code:

  function greet(name) {
    return \`Hello, \${name}! Welcome to CCAAS!\`;
  }

  console.log(greet('World'));
  // Output: Hello, World! Welcome to CCAAS!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Congratulations! You've successfully used
   a CCAAS skill to generate a file.

Learn more about skills:
- Skills can be enabled/disabled dynamically
- Each skill has specific triggers
- Skills can generate files, analyze data, and more

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by CCAAS Demo
`
    } else {
      content = `# ${file.name}\n\nThis is simulated content for the demo.\n\nGenerated by CCAAS Demo at ${new Date().toISOString()}`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return {
    skills,
    session,
    toggleSkill,
    restartSession,
    sendMessage,
    downloadFile,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
