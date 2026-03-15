#!/usr/bin/env node
/**
 * Demo: write_output Correct Pattern
 *
 * This MCP server demonstrates the ONLY correct way to implement write_output.
 *
 * CCAAS EventMapper reads tool results from content[].text JSON.
 * The value MUST be in content[].text, not in _meta.
 *
 * ✅ CORRECT: value inside content[].text JSON
 * ❌ WRONG: value in _meta.outputUpdate (EventMapper ignores _meta entirely)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { OutputUpdatePayloadSchema } from '@kedge-agentic/common/schemas'

const VALID_FIELDS = ['title', 'summary'] as const
type ValidField = (typeof VALID_FIELDS)[number]

const server = new Server(
  { name: 'demo-write-output-tools', version: '1.0.0' },
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

    // ✅ CORRECT: flat structure — field, value, status at top level
    // CCAAS EventMapper parses this and emits output_update event.
    //
    // ❌ WRONG (do NOT do this):
    // return {
    //   content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    //   _meta: { outputUpdate: { field, value, preview } },  // EventMapper ignores _meta!
    // }
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
