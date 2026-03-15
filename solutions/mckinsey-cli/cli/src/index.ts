import { io } from 'socket.io-client'
import * as readline from 'readline'
import chalk from 'chalk'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { randomUUID } from 'crypto'

const BACKEND_URL = process.env.CCAAS_URL || 'http://localhost:3001'
const API_KEY = process.env.KEDGE_API_KEY || ''
const TENANT_ID = 'mckinsey-cli'
const SKILL_SLUG = 'mckinsey-consultant'
const CONFIG_DIR = path.join(os.homedir(), '.config', 'mckinsey-cli')
const SESSION_FILE = path.join(CONFIG_DIR, 'session')

interface FileInfo {
  id: string
  name: string
  size?: number
  path?: string
}

/** A node in the file tree returned by the backend */
interface FileTreeNode {
  id: string
  name: string
  type?: 'file' | 'directory'
  size?: number
  path?: string
  children?: FileTreeNode[]
}

/** Backend message list response (may be an array or paginated) */
interface MessageItem {
  id: string
  role: 'user' | 'assistant' | 'system'
  content?: string
}

interface MessagesResponse {
  items?: MessageItem[]
}

/** Backend file tree response */
interface FileTreeResponse {
  tree?: FileTreeNode[]
}

/** Socket event: agent_status */
interface AgentStatusEvent {
  status: 'running' | 'complete' | 'idle' | 'error'
}

/** Socket event: text_delta */
interface TextDeltaEvent {
  delta?: string
}

/** Socket event: tool_activity */
interface ToolActivityEvent {
  payload?: {
    type?: string
    activityType?: string
    toolName?: string
    tool?: string
  }
}

/** Socket event: error */
interface SocketErrorEvent {
  payload?: {
    message?: string
  }
}

/** Build common request headers including API key auth when configured */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }
  return headers
}

// Ensure config directory exists
fs.mkdirSync(CONFIG_DIR, { recursive: true })

// Session state
let SESSION_ID = loadOrCreateSession()
let clientId = ''
let isProcessing = false
const knownFileIds = new Set<string>()
const sessionFiles: FileInfo[] = []

function loadOrCreateSession(): string {
  if (process.argv.includes('--new')) {
    const id = randomUUID()
    fs.writeFileSync(SESSION_FILE, id)
    return id
  }
  try {
    const saved = fs.readFileSync(SESSION_FILE, 'utf-8').trim()
    // Validate it's a UUID (backend requires UUID format for --resume)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved)) {
      return saved
    }
    // Legacy non-UUID session ID: generate fresh UUID
    const id = randomUUID()
    fs.writeFileSync(SESSION_FILE, id)
    return id
  } catch {
    const id = randomUUID()
    fs.writeFileSync(SESSION_FILE, id)
    return id
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function flattenTree(tree: FileTreeNode[]): FileInfo[] {
  const files: FileInfo[] = []
  function walk(nodes: FileTreeNode[]) {
    for (const node of nodes) {
      if (node.type === 'file' || !node.type) {
        files.push({ id: node.id, name: node.name, size: node.size, path: node.path })
      }
      if (node.children) walk(node.children)
    }
  }
  walk(tree)
  return files
}

async function checkForNewFiles() {
  try {
    const messagesResp = await fetch(
      `${BACKEND_URL}/api/v1/sessions/${SESSION_ID}/messages?take=5`,
      { headers: authHeaders() }
    )
    if (!messagesResp.ok) return

    const messages = (await messagesResp.json()) as MessageItem[] | MessagesResponse
    const msgList: MessageItem[] = Array.isArray(messages) ? messages : messages.items || []
    const lastMsg = msgList.find((m) => m.role === 'assistant')
    if (!lastMsg) return

    const filesResp = await fetch(
      `${BACKEND_URL}/api/v1/messages/${lastMsg.id}/files`,
      { headers: authHeaders() }
    )
    if (!filesResp.ok) return

    const data = (await filesResp.json()) as FileTreeResponse
    const files = flattenTree(data.tree || [])

    const newFiles = files.filter(f => !knownFileIds.has(f.id))
    if (newFiles.length === 0) return

    newFiles.forEach(f => knownFileIds.add(f.id))
    sessionFiles.push(...newFiles)

    console.log(chalk.yellow(`\n📁 ${newFiles.length} new file(s) created:`))
    newFiles.forEach(f => {
      const n = sessionFiles.indexOf(f) + 1
      const size = f.size ? ` (${formatBytes(f.size)})` : ''
      console.log(chalk.cyan(`  [${n}] ${f.name}${size}`))
    })
    console.log(chalk.dim('  Type /download <n> to save locally, /files to list all'))
  } catch (err: unknown) {
    // Log at debug level so file-check failures are visible when troubleshooting
    const message = err instanceof Error ? err.message : String(err)
    if (process.env.DEBUG) {
      console.error(chalk.dim(`[debug] File check failed: ${message}`))
    }
  }
}

async function downloadFile(file: FileInfo, dir?: string) {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/v1/files/${file.id}/download`, {
      headers: authHeaders(),
    })
    if (!resp.ok) {
      console.log(chalk.red(`✗ Download failed: ${resp.statusText}`))
      return
    }
    const buffer = await resp.arrayBuffer()
    const targetDir = dir || process.cwd()
    // Sanitize filename to prevent directory traversal (e.g. "../../etc/passwd")
    const safeName = path.basename(file.name)
    const localPath = path.join(targetDir, safeName)
    fs.writeFileSync(localPath, Buffer.from(buffer))
    console.log(chalk.green(`✓ Saved: ${localPath}`))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.log(chalk.red(`✗ Download error: ${message}`))
  }
}

// Banner
console.log(chalk.bold.blue('\n╔══════════════════════════════════════╗'))
console.log(chalk.bold.blue('║     McKinsey Consultant CLI          ║'))
console.log(chalk.bold.blue('╚══════════════════════════════════════╝'))
console.log(chalk.dim(`Backend: ${BACKEND_URL} | Session: ${SESSION_ID}`))
console.log(chalk.dim('Commands: /new  /session  /files  /download <n>  /exit\n'))

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  auth: API_KEY ? { token: API_KEY } : undefined,
})
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })


socket.on('connect', () => console.log(chalk.green('✓ Connected to CCAAS\n')))

socket.on('connect_error', (err) => {
  console.error(chalk.red(`✗ Connection failed: ${err.message}`))
  console.error(chalk.yellow('Is the CCAAS backend running? (npm run dev:backend)'))
  process.exit(1)
})

socket.on('client_id', (data: { clientId: string }) => {
  clientId = data.clientId
  promptUser()
})

socket.on('agent_status', async (event: AgentStatusEvent) => {
  const status = event?.status
  if (status === 'running') {
    isProcessing = true
    process.stdout.write('\n' + chalk.blue('◆ '))
  } else if (status === 'complete' || status === 'idle') {
    isProcessing = false
    process.stdout.write('\n')
    await checkForNewFiles()
    setTimeout(promptUser, 100)
  } else if (status === 'error') {
    isProcessing = false
    console.log(chalk.red('\n✗ Error occurred'))
    setTimeout(promptUser, 100)
  }
})

// Stream text output
socket.on('text_delta', (event: TextDeltaEvent) => {
  process.stdout.write(event?.delta || '')
})

// Show tool activity
socket.on('tool_activity', (event: ToolActivityEvent) => {
  const payload = event?.payload || {}
  const type = payload.type || payload.activityType
  const toolName = payload.toolName || payload.tool
  if (type === 'start' || type === 'input') {
    process.stdout.write(chalk.dim(`\n[${toolName}] `))
  }
})

socket.on('error', (event: SocketErrorEvent) => {
  console.error(chalk.red(`\n✗ ${event?.payload?.message || 'Error'}`))
})

function sendMessage(message: string) {
  socket.emit('chat', {
    sessionId: SESSION_ID,
    message,
    tenantId: TENANT_ID,
    clientId,
    enabledSkills: [SKILL_SLUG],
    // Do NOT set resumeSession: true — that forces --resume even for new sessions,
    // and --resume requires an existing Claude CLI session (fails for fresh sessions)
  })
}

function promptUser() {
  if (isProcessing) return
  rl.question(chalk.cyan('\nYou: '), async (input) => {
    const cmd = input.trim()
    if (!cmd) { promptUser(); return }

    // Exit
    if (cmd === '/exit' || cmd === 'exit' || cmd === 'quit') {
      console.log(chalk.dim('\nSession saved. Goodbye!\n'))
      rl.close(); socket.disconnect(); process.exit(0)
    }

    // New session
    if (cmd === '/new') {
      SESSION_ID = randomUUID()
      fs.writeFileSync(SESSION_FILE, SESSION_ID)
      sessionFiles.length = 0
      knownFileIds.clear()
      console.log(chalk.green(`✓ New session: ${SESSION_ID}`))
      promptUser(); return
    }

    // Show session ID
    if (cmd === '/session') {
      console.log(chalk.dim(`Session: ${SESSION_ID}`))
      promptUser(); return
    }

    // List files
    if (cmd === '/files') {
      if (sessionFiles.length === 0) {
        console.log(chalk.dim('No files created yet in this session'))
      } else {
        console.log(chalk.yellow(`\n📁 Files in this session (${sessionFiles.length}):`))
        sessionFiles.forEach((f, i) => {
          const size = f.size ? ` (${formatBytes(f.size)})` : ''
          console.log(chalk.cyan(`  [${i + 1}] ${f.name}${size}`))
        })
      }
      promptUser(); return
    }

    // Download file(s)
    if (cmd.startsWith('/download')) {
      const arg = cmd.split(' ').slice(1).join(' ').trim()
      if (!arg) {
        console.log(chalk.dim('Usage: /download <n> | /download all'))
        promptUser(); return
      }
      if (arg === 'all') {
        if (sessionFiles.length === 0) {
          console.log(chalk.dim('No files to download'))
        } else {
          const dir = path.join(process.cwd(), 'mckinsey-downloads')
          fs.mkdirSync(dir, { recursive: true })
          console.log(chalk.yellow(`Downloading ${sessionFiles.length} file(s) to ${dir}/`))
          for (const f of sessionFiles) await downloadFile(f, dir)
        }
      } else {
        const idx = parseInt(arg, 10) - 1
        if (isNaN(idx) || idx < 0 || idx >= sessionFiles.length) {
          console.log(chalk.red(`No file #${arg}. Use /files to list available files.`))
        } else {
          await downloadFile(sessionFiles[idx])
        }
      }
      promptUser(); return
    }

    // Send message to agent
    sendMessage(cmd)
  })
}

process.on('SIGINT', () => {
  console.log(chalk.dim('\n\nSession saved. Goodbye!\n'))
  rl.close(); socket.disconnect(); process.exit(0)
})
