#!/usr/bin/env node
/**
 * Demo: Sync Fields
 *
 * This MCP server implements write_output for profile fields.
 * Uses OutputUpdatePayloadSchema from @kedge-agentic/common
 * to ensure the correct payload format for output_update events.
 *
 * syncFields in solution.json groups these fields:
 *   basic: [name, email, department]
 *   detail: [role, bio]
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { OutputUpdatePayloadSchema } from '@kedge-agentic/common/schemas'

const VALID_FIELDS = ['name', 'email', 'department', 'role', 'bio'] as const
type ValidField = (typeof VALID_FIELDS)[number]

const server = new Server(
  { name: 'demo-sync-fields-tools', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

const writeOutputTool: Tool = {
  name: 'write_output',
  description: `Write structured data to the frontend form.
Valid fields: ${VALID_FIELDS.join(', ')}`,
  inputSchema: {
    type: 'object',
    properties: {
      field: {
        type: 'string',
        enum: [...VALID_FIELDS],
        description: 'The form field to update',
      },
      value: {
        type: 'string',
        description: 'The value for the field (string)',
      },
      preview: {
        type: 'string',
        description: 'Human-readable summary shown on the sync button',
      },
    },
    required: ['field', 'value'],
  },
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [writeOutputTool] }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'write_output') {
    const { field, value, preview } = args as {
      field: string
      value: unknown
      preview?: string
    }

    if (!VALID_FIELDS.includes(field as ValidField)) {
      return {
        content: [{ type: 'text', text: JSON.stringify({
          error: `Invalid field: ${field}. Valid fields: ${VALID_FIELDS.join(', ')}`,
          status: 'error',
        })}],
        isError: true,
      }
    }

    const payload = OutputUpdatePayloadSchema.parse({
      field, value, preview,
      status: 'success',
    })
    return {
      content: [{ type: 'text', text: JSON.stringify(payload) }],
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({
      error: `Unknown tool: ${name}`,
      status: 'error',
    })}],
    isError: true,
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
