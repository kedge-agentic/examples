# Problem Explainer Solution - Claude Code Guide

## Overview

This solution provides AI-powered step-by-step problem explanation for all subjects. It follows the CCAAS output update pattern for synchronizing AI-generated content to the frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    solution.json (配置)                      │
├─────────────────────────────────────────────────────────────┤
│  Backend (NestJS)  │  Frontend (React)  │  MCP Server       │
│  - REST API :3003  │  - UI :5281        │  - write_output   │
│  - SQLite DB       │  - Socket.io       │  - 知识点查询     │
│  - Problem mgmt    │  - 状态同步        │  - stdio transport│
└─────────────────────────────────────────────────────────────┘
```

## API Contracts

### Problems API

```typescript
// GET /api/problems
// Response: Problem[]

// GET /api/problems/:id
// Response: Problem

// POST /api/problems
// Body: CreateProblemDto
// Response: Problem

// PUT /api/problems/:id
// Body: UpdateProblemDto
// Response: Problem

// PATCH /api/problems/:id/field
// Body: { field: SyncField, value: any }
// Response: Problem
```

### Explanations API

```typescript
// GET /api/explanations/problem/:problemId
// Response: Explanation | null

// POST /api/explanations
// Body: CreateExplanationDto
// Response: Explanation
```

### Knowledge Points API

```typescript
// GET /api/subjects
// Response: Subject[]

// GET /api/knowledge-points?subject=math&grade=7
// Response: KnowledgePoint[]
```

### Sessions API (Proxy to CCAAS)

```typescript
// GET /api/sessions/:sessionId/messages
// Response: Message[]
```

## SYNC_FIELDS

Fields that can be updated via the `write_output` MCP tool:

```typescript
type SyncField =
  | 'problemAnalysis'    // 题目分析
  | 'keyKnowledge'       // 核心知识点
  | 'solutionSteps'      // 解题步骤
  | 'answer'             // 答案
  | 'commonMistakes'     // 易错点
  | 'relatedProblems'    // 变式练习
  | 'hints'              // 提示
  | 'difficulty'         // 难度评估
```

## Data Types

```typescript
interface Problem {
  id: string
  tenantId: string
  content: string           // 题目文本
  imageUrl?: string         // 题目图片
  subject: string           // 学科
  gradeLevel: string        // 年级
  problemType: string       // 题型
  knowledgePoints: string[] // 知识点ID
  status: 'pending' | 'explaining' | 'completed'
  createdAt: string
  updatedAt: string
}

interface Explanation {
  id: string
  problemId: string
  problemAnalysis: string
  keyKnowledge: string[]
  solutionSteps: SolutionStep[]
  answer: string
  commonMistakes: string[]
  relatedProblems: string[]
  hints: string[]
  difficulty: string
  createdAt: string
}

interface SolutionStep {
  stepNumber: number
  description: string
  formula?: string         // LaTeX
  explanation: string
}
```

## MCP Tools

### write_output
Synchronizes AI-generated content to the frontend.

```typescript
{
  field: SyncField,
  value: any,
  preview: string  // Human-readable preview
}
```

### get_subjects
Returns available subjects.

### get_knowledge_points
Query knowledge points by subject and grade.

```typescript
{
  subject: string,
  grade?: string
}
```

### search_related_problems
Find similar problems for practice.

```typescript
{
  knowledgePointIds: string[],
  difficulty?: string
}
```

## Development Commands

```bash
# Install dependencies
cd solutions/problem-explainer
npm install

# Start backend (port 3003)
cd backend && npm run start:dev

# Start frontend (port 5281)
cd frontend && npm run dev

# Build MCP server
cd mcp-server && npm run build
```

## Testing

```bash
# Run all tests
npm test

# Test specific module
cd backend && npm test -- --testPathPattern=problems
cd frontend && npm test
```

## WebSocket Events

```typescript
// From CCAAS
'text_delta': { delta: string }
'output_update': { field: SyncField, value: any, preview: string }
'agent_status': { status: 'thinking' | 'complete' }
```

## File Upload

Uses CCAAS file system:
1. Upload via `POST /api/v1/files/upload`
2. Image stored in `.agent-workspace/sessions/{sessionId}/images/`
3. Claude Code reads via `Read` tool with native vision
