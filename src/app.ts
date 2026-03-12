import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { swaggerUi, specs } from './swagger.js';
import { messageController } from './controllers/message.controller.js';
import { channelController } from './controllers/channel.controller.js';
import { agentController } from './controllers/agent.controller.js';
import { vectorController } from './controllers/vector.controller.js';
import { summaryController } from './controllers/summary.controller.js';
import { progressController } from './controllers/progress.controller.js';
import { documentController } from './controllers/document.controller.js';
import {
  generalLimiter,
  agentLimiter,
  messageLimiter,
  vectorLimiter,
  validateMessage,
  validateDiscussion,
  validateVectorSearch,
  requireOllama
} from './middleware/index.js';
import { checkOllama, checkEmbedModel } from './middleware/ollama-health.middleware.js';

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
app.post(
  '/api/channels/:channelId/ask',
  agentLimiter,
  requireOllama,
  agentController.askAgent
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

// RAG ingest endpoints
app.post('/api/progress', progressController.recordProgress);
app.post('/api/documents', documentController.ingest);

// Health
app.get('/api/health', async (_req: Request, res: Response) => {
  const chatModelOk = await checkOllama();
  const embedModelOk = await checkEmbedModel();
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';

  const allOk = chatModelOk && (!embeddingsEnabled || embedModelOk);

  res.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date(),
    models: {
      chat: {
        model: process.env.OLLAMA_MODEL || 'hermes3:8b',
        status: chatModelOk ? 'ready' : 'unavailable',
        purpose: 'agent discussions and responses'
      },
      embedding: {
        model: process.env.OLLAMA_EMBED_MODEL || 'all-minilm',
        status: embeddingsEnabled
          ? (embedModelOk ? 'ready' : 'unavailable — run: ollama pull all-minilm')
          : 'disabled',
        purpose: 'vector search and message embeddings'
      }
    },
    services: {
      api: 'running',
      mastra: 'ready',
      ollama: chatModelOk ? 'running' : 'unavailable'
    }
  });
});

export default app;
