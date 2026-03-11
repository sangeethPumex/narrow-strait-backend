import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import 'dotenv/config';
import app from './app.js';
import { channelService } from './services/channel.service.js';
import { setIO } from './socket/io.js';
import { registerSocketHandlers } from './socket/socket.handler.js';

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/simco-slack';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: FRONTEND_URL, credentials: true }
});
setIO(io);
registerSocketHandlers(io);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function initializeChannels() {
  try {
    const existing = await channelService.getAllChannels();
    if (existing.length > 0) {
      console.log(`✅ ${existing.length} channels already exist`);
      return;
    }

    const channels = [
      {
        name: 'board-of-directors',
        displayName: 'Board of Directors',
        type: 'group',
        description: 'CEO, CTO, CFO, COO strategic discussions',
        members: [
          { id: 'user', name: 'You', role: 'Founder', joinedAt: new Date() },
          { id: 'ceo-sarah', name: 'Sarah Chen', role: 'CEO', joinedAt: new Date() },
          { id: 'cto-marcus', name: 'Marcus Wei', role: 'CTO', joinedAt: new Date() },
          { id: 'cfo-priya', name: 'Priya Patel', role: 'CFO', joinedAt: new Date() },
          { id: 'coo-james', name: 'James Park', role: 'COO', joinedAt: new Date() }
        ]
      },
      {
        name: 'standup-executives',
        displayName: 'Standup: Executives',
        type: 'group',
        members: [
          { id: 'user', name: 'You', joinedAt: new Date() },
          { id: 'ceo-sarah', name: 'Sarah Chen', joinedAt: new Date() },
          { id: 'cto-marcus', name: 'Marcus Wei', joinedAt: new Date() },
          { id: 'cfo-priya', name: 'Priya Patel', joinedAt: new Date() },
          { id: 'coo-james', name: 'James Park', joinedAt: new Date() }
        ]
      },
      {
        name: 'legal',
        displayName: 'Legal',
        type: 'group',
        members: [
          { id: 'user', name: 'You', joinedAt: new Date() },
          { id: 'legal-counsel', name: 'Alex Rivera', role: 'General Counsel', joinedAt: new Date() }
        ]
      },
      {
        name: 'market-intelligence',
        displayName: 'Market Intelligence',
        type: 'group',
        members: [
          { id: 'user', name: 'You', joinedAt: new Date() },
          {
            id: 'competitor-monitor',
            name: 'Market Intel',
            role: 'Competitor Watch',
            joinedAt: new Date()
          }
        ]
      }
    ];

    for (const channel of channels) {
      await channelService.createChannel(channel);
    }
    console.log(`✅ Created ${channels.length} default channels`);
  } catch (error) {
    console.error('Channel init error:', error);
  }
}

async function checkModels() {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const chatModel = process.env.OLLAMA_MODEL || 'llama3.2:1b';
  const embedModel = process.env.OLLAMA_EMBED_MODEL || 'all-minilm';
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';

  console.log('🔍 Checking Ollama models...');

  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    const data = (await res.json()) as { models: { name: string }[] };
    const available = data.models.map(m => m.name);

    const chatOk = available.some(n => n.startsWith(chatModel.split(':')[0]));
    const embedOk = available.some(n => n.startsWith(embedModel.split(':')[0]));

    console.log(`  Chat model    [${chatModel}]: ${chatOk ? '✅ ready' : '❌ NOT FOUND — run: ollama pull ' + chatModel}`);

    if (embeddingsEnabled) {
      console.log(`  Embed model   [${embedModel}]: ${embedOk ? '✅ ready' : '❌ NOT FOUND — run: ollama pull ' + embedModel}`);
    } else {
      console.log(`  Embed model   [${embedModel}]: ⏸️  disabled (ENABLE_EMBEDDINGS=false)`);
    }

    if (!chatOk) {
      console.error('❌ Chat model not available — agents will not work');
    }
    if (embeddingsEnabled && !embedOk) {
      console.warn('⚠️ Embed model not available — vector search will return empty results');
      console.warn(`   Fix: ollama pull ${embedModel}`);
    }
  } catch (error) {
    console.error('❌ Could not connect to Ollama:', (error as Error).message);
    console.error('   Fix: make sure Ollama is running — ollama serve');
  }
}

async function startServer() {
  await connectDB();
  await checkModels();
  await initializeChannels();

  httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════╗
║  🚀 SimCo Backend Running          ║
╠════════════════════════════════════╣
║ API:       http://localhost:${PORT}   ║
║ WebSocket: ws://localhost:${PORT}    ║
║ Mastra:    Ready                   ║
║ MongoDB:   Connected               ║
╚════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  httpServer.close(() => {
    mongoose.disconnect();
    process.exit(0);
  });
});
