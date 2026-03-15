# CCAAS Demo

A demonstration frontend showcasing the Claude Code as a Service (CCAAS) capabilities.

## Features

- **Skills Management**: Toggle skills on/off to customize AI behavior
- **Chat Interface**: Interactive chat with streaming responses
- **File Downloads**: Download files created by the AI assistant
- **Session Restart**: Restart sessions to apply skill changes

## Quick Start

### One-Command Setup (Recommended)

```bash
# From the solutions/ccaas-demo directory
chmod +x setup.sh
./setup.sh
```

This will:
1. Clear the database (fresh start)
2. Install dependencies if needed
3. Start the backend server (port 3001)
4. Create sample skills
5. Start the demo frontend (port 5179)

Press `Ctrl+C` to stop all services.

### Command Line Options

```bash
./setup.sh [OPTIONS]

Options:
  --backend-port PORT    Backend port (default: 3001)
  --demo-port PORT       Demo port (default: 5179)
  --skip-db              Skip database cleanup
  --skip-skills          Skip skills creation
  --help                 Show help message

Examples:
  ./setup.sh --backend-port 4000 --demo-port 8080
  ./setup.sh --skip-db --skip-skills
```

### Manual Setup

If you prefer to run services separately:

```bash
# Terminal 1: Start backend
cd packages/backend
npm run start:dev

# Terminal 2: Start demo
cd solutions/ccaas-demo
npm install
npm run dev
```

## Access

- **Demo Frontend**: http://localhost:5179
- **Backend API**: http://localhost:3001

## Sample Skills

Skills are defined as JSON files in the `skills/` directory:

```
skills/
├── hello-world.json      # Friendly greeting skill
├── report-generator.json # Generate formatted reports
└── file-creator.json     # Create files on demand
```

| Skill | Trigger Keywords | Purpose |
|-------|-----------------|---------|
| Hello World | hello, hi, 你好 | Friendly greeting |
| Report Generator | report, 报告 | Generate formatted reports |
| File Creator | create file, 创建文件 | Create files on demand

### Adding Custom Skills

Create a new JSON file in the `skills/` directory:

```json
{
  "name": "My Custom Skill",
  "slug": "my-custom-skill",
  "description": "Description of what this skill does",
  "type": "skill",
  "content": "# Skill Instructions\n\nDetailed instructions for the AI...",
  "triggers": [
    { "type": "keyword", "value": "trigger word" }
  ],
  "allowedTools": ["Write", "Read"]
}
```

Run `./setup.sh` to load the new skill. |

## Development

### Project Structure

```
ccaas-demo/
├── setup.sh              # One-command setup script
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
├── skills/               # Skill definitions (JSON)
│   ├── hello-world.json
│   ├── report-generator.json
│   └── file-creator.json
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Main app component
│   ├── components/       # UI components
│   │   ├── SkillsSidebar.tsx
│   │   ├── RestartBanner.tsx
│   │   └── FileCard.tsx
│   └── styles/
│       └── index.css     # Global styles
```

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Logs

When using `setup.sh`, logs are available at:
- Backend: `/tmp/ccaas-backend.log`
- Demo: `/tmp/ccaas-demo.log`

## Troubleshooting

### Skills not loading

1. Verify backend is running: `curl http://localhost:3001/api/v1/health`
2. Check skills exist: `curl http://localhost:3001/api/v1/skills`
3. Check browser console for CORS errors

### Connection failed

1. Ensure ports 3001 and 5179 are available
2. Check for processes using these ports: `lsof -i :3001`
3. Review backend logs: `tail -f /tmp/ccaas-backend.log`

### Session restart not working

The demo requires a session restart when skills are toggled. This is by design - the Claude CLI process needs to be restarted to pick up skill changes.
