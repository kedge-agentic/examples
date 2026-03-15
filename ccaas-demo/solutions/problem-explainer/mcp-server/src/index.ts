#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SYNC_FIELDS, SyncField, WriteOutputInput, WriteOutputResult, Subject } from './types.js';

// Tool definitions
const tools: Tool[] = [
  {
    name: 'write_output',
    description:
      'Write structured data to a specific field in the frontend UI. Use this to sync AI-generated content to the problem explanation form.',
    inputSchema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: SYNC_FIELDS,
          description: 'The field to update: problemAnalysis, keyKnowledge, solutionSteps, answer, commonMistakes, relatedProblems, hints, or difficulty',
        },
        value: {
          description: 'The value to write. Type depends on field: string for problemAnalysis/answer/difficulty, string[] for keyKnowledge/commonMistakes/relatedProblems/hints, SolutionStep[] for solutionSteps',
        },
        preview: {
          type: 'string',
          description: 'A human-readable preview of the value (max 100 chars)',
        },
      },
      required: ['field', 'value', 'preview'],
    },
  },
  {
    name: 'get_subjects',
    description: 'Get the list of available subjects (学科)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_knowledge_points',
    description: 'Get knowledge points for a specific subject and optional grade level',
    inputSchema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'Subject ID (e.g., math, physics, chemistry)',
        },
        grade: {
          type: 'string',
          description: 'Optional grade level (e.g., 7, 8, 9)',
        },
      },
      required: ['subject'],
    },
  },
  {
    name: 'search_related_problems',
    description: 'Search for related practice problems based on knowledge points',
    inputSchema: {
      type: 'object',
      properties: {
        knowledgePointIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of knowledge point IDs to search for',
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard'],
          description: 'Optional difficulty filter',
        },
      },
      required: ['knowledgePointIds'],
    },
  },
];

// Subjects data
const subjects: Subject[] = [
  { id: 'math', name: '数学', hasFormula: true },
  { id: 'physics', name: '物理', hasFormula: true },
  { id: 'chemistry', name: '化学', hasFormula: true },
  { id: 'biology', name: '生物', hasFormula: false },
  { id: 'chinese', name: '语文', hasFormula: false },
  { id: 'english', name: '英语', hasFormula: false },
  { id: 'history', name: '历史', hasFormula: false },
  { id: 'geography', name: '地理', hasFormula: false },
  { id: 'politics', name: '政治', hasFormula: false },
];

// Mock knowledge points (in production, load from data files)
const knowledgePoints: Record<string, Array<{ id: string; name: string; grade?: string; description?: string }>> = {
  math: [
    { id: 'math-1', name: '一元一次方程', grade: '7', description: '含有一个未知数且未知数的最高次数是1的方程' },
    { id: 'math-2', name: '二元一次方程组', grade: '7', description: '含有两个未知数的一次方程组' },
    { id: 'math-3', name: '一元二次方程', grade: '9', description: '只含有一个未知数且未知数的最高次数是2的方程' },
    { id: 'math-4', name: '勾股定理', grade: '8', description: '直角三角形两直角边的平方和等于斜边的平方' },
    { id: 'math-5', name: '相似三角形', grade: '9', description: '对应角相等，对应边成比例的三角形' },
  ],
  physics: [
    { id: 'physics-1', name: '力的概念', grade: '8', description: '力是物体对物体的作用' },
    { id: 'physics-2', name: '牛顿第一定律', grade: '9', description: '惯性定律' },
    { id: 'physics-3', name: '牛顿第二定律', grade: '9', description: 'F=ma' },
    { id: 'physics-4', name: '电路基础', grade: '9', description: '串联电路和并联电路' },
  ],
  chemistry: [
    { id: 'chem-1', name: '物质的分类', grade: '9', description: '纯净物和混合物、单质和化合物' },
    { id: 'chem-2', name: '化学方程式', grade: '9', description: '用化学式表示化学反应的式子' },
    { id: 'chem-3', name: '酸碱盐', grade: '9', description: '酸、碱、盐的性质和反应' },
  ],
};

// Create server
const server = new Server(
  {
    name: 'problem-explainer-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'write_output': {
      const input = args as WriteOutputInput;

      // Validate field
      if (!SYNC_FIELDS.includes(input.field as SyncField)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Invalid field: ' + input.field }),
            },
          ],
        };
      }

      // Return the output update result
      const result: WriteOutputResult = {
        data: {
          field: input.field,
          value: input.value,
          preview: input.preview.slice(0, 100),
        },
        status: 'success',
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    }

    case 'get_subjects': {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(subjects),
          },
        ],
      };
    }

    case 'get_knowledge_points': {
      const { subject, grade } = args as { subject: string; grade?: string };
      let points = knowledgePoints[subject] || [];

      if (grade) {
        points = points.filter((p) => !p.grade || p.grade === grade);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(points),
          },
        ],
      };
    }

    case 'search_related_problems': {
      // In production, this would query a database
      // For now, return mock data
      const { knowledgePointIds, difficulty } = args as {
        knowledgePointIds: string[];
        difficulty?: string;
      };

      const mockProblems = [
        {
          id: 'related-1',
          content: '变式练习1：类似题目...',
          difficulty: difficulty || 'medium',
          knowledgePoints: knowledgePointIds,
        },
        {
          id: 'related-2',
          content: '变式练习2：进阶题目...',
          difficulty: 'hard',
          knowledgePoints: knowledgePointIds,
        },
      ];

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProblems),
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Unknown tool: ' + name }),
          },
        ],
      };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Problem Explainer MCP Server running on stdio');
}

main().catch(console.error);
