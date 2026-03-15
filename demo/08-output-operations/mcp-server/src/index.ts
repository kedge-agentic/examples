#!/usr/bin/env node
/**
 * Demo: Output Operations (set / append / merge)
 *
 * This MCP server demonstrates write_output with an operation parameter
 * that controls how the value is applied to the target field.
 *
 * Operations:
 *   - set:    Replace the field value entirely
 *   - append: Add an item to an array field
 *   - merge:  Merge an object into an existing object field
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { OutputUpdatePayloadSchema } from '@kedge-agentic/common/schemas'

const VALID_FIELDS = ['title', 'items', 'config'] as const
type ValidField = (typeof VALID_FIELDS)[number]

const VALID_OPERATIONS = ['set', 'append', 'merge'] as const
type ValidOperation = (typeof VALID_OPERATIONS)[number]

const server = new Server(
  { name: 'demo-output-operations-tools', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

const writeOutputTool: Tool = {
  name: 'write_output',
  description: `Write structured data to the frontend using set, append, or merge operations.
Valid fields: ${VALID_FIELDS.join(', ')}
Valid operations: set (replace value), append (add to array), merge (merge into object)`,
  inputSchema: {
    type: 'object',
    properties: {
      field: {
        type: 'string',
        enum: [...VALID_FIELDS],
        description: 'The output field to update (title, items, or config)',
      },
      value: {
        description: 'The value: string for set, item for append, object for merge',
      },
      operation: {
        type: 'string',
        enum: [...VALID_OPERATIONS],
        description: 'How to apply the value: set (replace), append (add to array), merge (merge objects)',
      },
      preview: {
        type: 'string',
        description: 'Human-readable summary shown on the sync button',
      },
    },
    required: ['field', 'value', 'operation'],
  },
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [writeOutputTool] }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'write_output') {
    const { field, value, operation, preview } = args as {
      field: string
      value: unknown
      operation: string
      preview?: string
    }

    if (!VALID_FIELDS.includes(field as ValidField)) {
      return {
        content: [{ type: 'text', text: JSON.stringify({
          data: { error: `Invalid field: ${field}. Valid fields: ${VALID_FIELDS.join(', ')}` },
          status: 'error',
        })}],
        isError: true,
      }
    }

    if (!VALID_OPERATIONS.includes(operation as ValidOperation)) {
      return {
        content: [{ type: 'text', text: JSON.stringify({
          data: { error: `Invalid operation: ${operation}. Valid operations: ${VALID_OPERATIONS.join(', ')}` },
          status: 'error',
        })}],
        isError: true,
      }
    }

    const payload = OutputUpdatePayloadSchema.parse({
      data: { field, value, operation, preview },
      status: 'success',
    })
    return {
      content: [{ type: 'text', text: JSON.stringify(payload) }],
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({
      data: { error: `Unknown tool: ${name}` },
      status: 'error',
    })}],
    isError: true,
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
