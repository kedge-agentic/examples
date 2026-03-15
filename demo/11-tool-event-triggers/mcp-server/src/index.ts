#!/usr/bin/env node
/**
 * Demo: Tool Event Triggers
 *
 * This MCP server returns plain JSON results from tools.
 * The toolEventTriggers in solution.json maps these results
 * to output_update events automatically — no special format needed.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'

const server = new Server(
  { name: 'demo-tool-event-triggers', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

const calculateScoreTool: Tool = {
  name: 'calculate_score',
  description: 'Evaluate input text against criteria and return a score with breakdown.',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'The text to evaluate',
      },
      criteria: {
        type: 'string',
        description: 'Comma-separated evaluation criteria (e.g. "relevance, clarity, depth")',
      },
    },
    required: ['input', 'criteria'],
  },
}

const generateSummaryTool: Tool = {
  name: 'generate_summary',
  description: 'Generate a concise summary of the provided text.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to summarize',
      },
    },
    required: ['text'],
  },
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [calculateScoreTool, generateSummaryTool] }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'calculate_score') {
    const { input, criteria } = args as { input: string; criteria: string }
    const inputLength = input.length
    const criteriaList = criteria.split(',').map((c) => c.trim())

    // Simple scoring logic for demonstration
    const relevance = Math.min(100, Math.round(inputLength / 2 + 30))
    const clarity = Math.min(100, Math.round(inputLength / 3 + 40))
    const depth = Math.min(100, Math.round(inputLength / 4 + 20))
    const score = Math.round((relevance + clarity + depth) / 3)

    const breakdown: Record<string, number> = { relevance, clarity, depth }
    // Add any extra criteria from user input
    for (const c of criteriaList) {
      if (!(c in breakdown)) {
        breakdown[c] = Math.min(100, Math.round(inputLength / 3 + 25))
      }
    }

    // Plain JSON — toolEventTriggers in solution.json maps this to output_update
    return {
      content: [{ type: 'text', text: JSON.stringify({ score, breakdown }) }],
    }
  }

  if (name === 'generate_summary') {
    const { text } = args as { text: string }

    const words = text.split(/\s+/)
    const summaryLength = Math.max(5, Math.round(words.length / 3))
    const summary = words.slice(0, summaryLength).join(' ') + '...'

    // Plain JSON — toolEventTriggers in solution.json maps this to output_update
    return {
      content: [{ type: 'text', text: JSON.stringify({ summary }) }],
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
    isError: true,
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
