import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { swaggerUi, specs } from './swagger.js';
import { messageController } from './controllers/message.controller.js';
import { channelController } from './controllers/channel.controller.js';
import { agentController } from './controllers/agent.controller.js';
import { vectorController } from './controllers/vector.controller.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Swagger documentation
/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API Documentation
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Channels
app.get('/api/channels', channelController.getChannels);
app.get('/api/channels/:channelId', channelController.getChannel);
app.post('/api/channels', channelController.createChannel);

// Messages
app.post('/api/channels/:channelId/messages', messageController.sendMessage);
app.get('/api/channels/:channelId/messages', messageController.getMessages);
app.post('/api/messages/:messageId/reactions', messageController.reactToMessage);

// Agents
app.post('/api/channels/:channelId/trigger-discussion', agentController.startDiscussion);

// Vector
app.post('/api/channels/:channelId/vector-search', vectorController.findSimilarMessages);

// Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    services: { api: 'running', mastra: 'ready' }
  });
});

export default app;
