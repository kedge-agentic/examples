# Problem Explainer (讲题专家)

AI-powered step-by-step problem explanation tool for students.

## Features

- **Multi-subject Support**: Math, Physics, Chemistry, Biology, Chinese, English, History, Geography, Politics
- **Image Recognition**: Upload problem images for Claude to analyze
- **Step-by-step Explanation**: Detailed solution with reasoning
- **Knowledge Point Linking**: Connect problems to curriculum standards
- **Practice Problems**: Generate similar problems for reinforcement

## Quick Start

```bash
# Start all services
./setup.sh

# Or start individually:
cd backend && npm run start:dev   # Port 3003
cd frontend && npm run dev        # Port 5281
```

## Usage

1. Open http://localhost:5281
2. Enter a problem (text or image)
3. Select subject and grade level
4. Click "开始讲解" (Start Explaining)
5. Review AI-generated explanation
6. Click sync buttons to save content

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Header (Problem Title, Subject, Grade, Status)           │
├────────────┬─────────────────────────┬───────────────────┤
│ Problem    │ Explanation             │ Chat Panel        │
│ Panel      │ Panel                   │                   │
│ (200px)    │ (flex)                  │ (400px)           │
│            │                         │                   │
│ - Content  │ - Problem Analysis      │ - Message List    │
│ - Image    │ - Key Knowledge         │ - Input           │
│ - Tags     │ - Solution Steps        │ - Quick Actions   │
│ - History  │ - Answer                │                   │
│            │ - Common Mistakes       │                   │
│            │ - Related Problems      │                   │
└────────────┴─────────────────────────┴───────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/problems | GET | List all problems |
| /api/problems/:id | GET | Get problem by ID |
| /api/problems | POST | Create problem |
| /api/subjects | GET | List subjects |
| /api/knowledge-points | GET | Query knowledge points |
| /api/sessions/:id/messages | GET | Get chat messages |

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed API contracts and development guide.

## License

Proprietary - All Rights Reserved
