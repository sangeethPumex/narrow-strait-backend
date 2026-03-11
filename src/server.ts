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

async function startServer() {
  await connectDB();
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
