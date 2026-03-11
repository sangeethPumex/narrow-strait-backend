import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { swaggerUi, specs } from './swagger.js';
import { messageController } from './controllers/message.controller.js';
import { channelController } from './controllers/channel.controller.js';
import { agentController } from './controllers/agent.controller.js';
import { vectorController } from './controllers/vector.controller.js';
import { summaryController } from './controllers/summary.controller.js';
import {
  generalLimiter,
  agentLimiter,
  messageLimiter,
  vectorLimiter,
  validateMessage,
  validateDiscussion,
  validateVectorSearch,
  requireOllama,
  checkOllama
} from './middleware/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', generalLimiter);

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
app.post('/api/channels/:channelId/messages', messageLimiter, validateMessage, messageController.sendMessage);
app.get('/api/channels/:channelId/messages', messageController.getMessages);
app.delete('/api/channels/:channelId/messages/garbage', messageController.cleanChannel);
app.post('/api/messages/:messageId/reactions', messageController.reactToMessage);

// Agents
app.post(
  '/api/channels/:channelId/trigger-discussion',
  agentLimiter,
  requireOllama,
  validateDiscussion,
  agentController.startDiscussion
);
app.post(
  '/api/channels/:channelId/trigger-conversation',
  agentLimiter,
  requireOllama,
  validateDiscussion,
  agentController.startConversationalDiscussion
);

// Vector
app.post(
  '/api/channels/:channelId/vector-search',
  vectorLimiter,
  requireOllama,
  validateVectorSearch,
  vectorController.findSimilarMessages
);

// Summaries
app.post('/api/channels/:channelId/summarize', summaryController.summarizeChannel);
app.get('/api/channels/:channelId/context', summaryController.getChannelContext);

// Health
app.get('/api/health', async (_req: Request, res: Response) => {
  const ollamaOk = await checkOllama();
  res.json({
    status: ollamaOk ? 'ok' : 'degraded',
    timestamp: new Date(),
    services: {
      api: 'running',
      mastra: 'ready',
      ollama: ollamaOk ? 'running' : 'unavailable'
    }
  });
});

export default app;
