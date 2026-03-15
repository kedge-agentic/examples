import { io } from 'socket.io-client'
import * as readline from 'readline'
import chalk from 'chalk'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { randomUUID } from 'crypto'

const crypto = { randomUUID }

const BACKEND_URL = process.env.CCAAS_URL || 'http://localhost:3001'
const TENANT_ID = 'mckinsey-cli'
const SKILL_SLUG = 'mckinsey-consultant'
const SESSION_FILE = path.join(os.homedir(), '.mckinsey-session')

interface FileInfo {
  id: string
  name: string
  size?: number
  path?: string
}

// Session state
let SESSION_ID = loadOrCreateSession()
let clientId = ''
let isProcessing = false
const knownFileIds = new Set<string>()
const sessionFiles: FileInfo[] = []

function generateUUID(): string {
  return crypto.randomUUID()
}

function loadOrCreateSession(): string {
  if (process.argv.includes('--new')) {
    const id = generateUUID()
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
    const id = generateUUID()
    fs.writeFileSync(SESSION_FILE, id)
    return id
  } catch {
    const id = generateUUID()
    fs.writeFileSync(SESSION_FILE, id)
    return id
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function flattenTree(tree: any[]): FileInfo[] {
  const files: FileInfo[] = []
  function walk(nodes: any[]) {
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
      `${BACKEND_URL}/api/v1/sessions/${SESSION_ID}/messages?take=5`
    )
    if (!messagesResp.ok) return

    const messages: any = await messagesResp.json()
    const msgList = Array.isArray(messages) ? messages : messages.items || []
    const lastMsg = msgList.find((m: any) => m.role === 'assistant')
    if (!lastMsg) return

    const filesResp = await fetch(
      `${BACKEND_URL}/api/v1/messages/${lastMsg.id}/files`
    )
    if (!filesResp.ok) return

    const data: any = await filesResp.json()
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
  } catch {
    // Silently ignore file check errors
  }
}

async function downloadFile(file: FileInfo, dir?: string) {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/v1/files/${file.id}/download`)
    if (!resp.ok) {
      console.log(chalk.red(`✗ Download failed: ${resp.statusText}`))
      return
    }
    const buffer = await resp.arrayBuffer()
    const targetDir = dir || process.cwd()
    const localPath = path.join(targetDir, file.name)
    fs.writeFileSync(localPath, Buffer.from(buffer))
    console.log(chalk.green(`✓ Saved: ${localPath}`))
  } catch (err: any) {
    console.log(chalk.red(`✗ Download error: ${err.message}`))
  }
}

// Banner
console.log(chalk.bold.blue('\n╔══════════════════════════════════════╗'))
console.log(chalk.bold.blue('║     McKinsey Consultant CLI          ║'))
console.log(chalk.bold.blue('╚══════════════════════════════════════╝'))
console.log(chalk.dim(`Backend: ${BACKEND_URL} | Session: ${SESSION_ID}`))
console.log(chalk.dim('Commands: /new  /session  /files  /download <n>  /exit\n'))

const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] })
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

socket.on('agent_status', async (event: any) => {
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
socket.on('text_delta', (event: any) => {
  process.stdout.write(event?.delta || '')
})

// Show tool activity
socket.on('tool_activity', (event: any) => {
  const payload = event?.payload || {}
  const type = payload.type || payload.activityType
  const toolName = payload.toolName || payload.tool
  if (type === 'start' || type === 'input') {
    process.stdout.write(chalk.dim(`\n[${toolName}] `))
  }
})

socket.on('error', (event: any) => {
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
      SESSION_ID = generateUUID()
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
