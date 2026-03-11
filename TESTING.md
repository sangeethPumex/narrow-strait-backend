# SimCo Backend - Testing Guide

## 🚀 Quick Start

### Prerequisites
1. **MongoDB**: Install and start MongoDB locally
   ```bash
   # On macOS with Homebrew
   brew install mongodb-community
   brew services start mongodb-community

   # On Windows/Linux, download from mongodb.com
   ```

2. **Ollama**: Install and start Ollama with phi4-mini model
   ```bash
   # Install Ollama from ollama.ai
   ollama pull phi4-mini
   ollama serve
   ```

### Start the Backend
```bash
pnpm install
pnpm dev
```

The server will start on `http://localhost:3001` with:
- ✅ MongoDB connected
- ✅ 4 default channels created
- ✅ Mastra agents ready

## 🧪 Testing Options

### Option 1: Automated API Tests
```bash
pnpm test
```
This runs comprehensive tests for all endpoints.

### Option 2: Manual Testing with Swagger UI
1. Open `http://localhost:3001/api-docs` in your browser
2. Use the interactive Swagger UI to test endpoints

### Option 3: Mastra Studio (Recommended for Agent Testing)
```bash
# In a separate terminal (while backend is running)
pnpm studio
```
This opens Mastra Studio at `http://localhost:3000` where you can:
- Test individual agents
- Run workflows
- Monitor agent interactions
- Debug AI responses

## 📋 API Endpoints

### Channels
- `GET /api/channels` - List all channels
- `GET /api/channels/:id` - Get specific channel
- `POST /api/channels` - Create new channel

### Messages
- `POST /api/channels/:id/messages` - Send message
- `GET /api/channels/:id/messages` - Get channel messages
- `POST /api/messages/:id/reactions` - Add reaction

### Agents
- `POST /api/channels/:id/trigger-discussion` - Start multi-agent discussion

### Vector Search
- `POST /api/channels/:id/vector-search` - Find similar messages

### Health
- `GET /api/health` - Service health check

## 🤖 Agent Testing Examples

### Trigger Agent Discussion
```bash
curl -X POST http://localhost:3001/api/channels/board-of-directors/trigger-discussion \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": {
      "title": "Burn Rate Analysis",
      "description": "We are burning $430K/month. Should we raise more capital or cut costs?"
    }
  }'
```

### Test Individual Agent Response
```bash
curl -X POST http://localhost:3001/api/channels/board-of-directors/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "@ceo-sarah What do you think about our burn rate?"}'
```

### Vector Search
```bash
curl -X POST http://localhost:3001/api/channels/board-of-directors/vector-search \
  -H "Content-Type: application/json" \
  -d '{"query": "burn rate", "limit": 3}'
```

## 🔧 Environment Variables

Create `.env` file:
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/simco-slack
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi4-mini
OLLAMA_EMBED_MODEL=phi4-mini
MASTRA_API_KEY=dev-key-simco
MASTRA_LOG_LEVEL=debug
VECTOR_MEMORY_ENABLED=true
```

## 📊 Default Channels Created

1. **Board of Directors** (`board-of-directors`)
   - CEO Sarah, CTO Marcus, CFO Priya, COO James

2. **Standup: Executives** (`standup-executives`)
   - All board members

3. **Legal** (`legal`)
   - You + Legal Counsel

4. **Market Intelligence** (`market-intelligence`)
   - You + Competitor Monitor

## 🎯 Mastra Studio Features

Mastra Studio provides:
- **Agent Playground**: Test individual agents with custom prompts
- **Workflow Runner**: Execute multi-agent discussions
- **Logs Viewer**: Monitor agent responses and errors
- **Configuration Editor**: Modify agent settings
- **Performance Metrics**: Response times and token usage

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
ps aux | grep mongod
# Or on Windows
Get-Process | Where-Object { $_.Name -like "*mongo*" }
```

### Ollama Issues
```bash
# Check if Ollama is running
ollama list
ollama ps
```

### Port Conflicts
- Backend runs on port 3001
- Mastra Studio runs on port 3000
- Ensure both ports are available

## 📖 Documentation

- **API Docs**: `http://localhost:3001/api-docs`
- **Mastra Studio**: `http://localhost:3000` (when running `pnpm studio`)
- **Health Check**: `http://localhost:3001/api/health`