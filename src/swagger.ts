import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SimCo Slack-Like Backend API',
      version: '1.0.0',
      description: 'API for SimCo - A Slack-like backend with AI agents and vector search',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            channelId: { type: 'string' },
            month: { type: 'number' },
            year: { type: 'number' },
            authorId: { type: 'string' },
            authorName: { type: 'string' },
            authorRole: { type: 'string' },
            authorAvatar: { type: 'string' },
            authorColor: { type: 'string' },
            content: { type: 'string' },
            contentType: { type: 'string', enum: ['text', 'voice', 'system'] },
            voiceUrl: { type: 'string' },
            isAgentMessage: { type: 'boolean' },
            agentPersonality: {
              type: 'object',
              properties: {
                tone: { type: 'string' },
                confidence: { type: 'number' },
                certainty: { type: 'string' }
              }
            },
            vectorEmbedding: { type: 'array', items: { type: 'number' } },
            reactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  emoji: { type: 'string' },
                  users: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            mentionedAgents: { type: 'array', items: { type: 'string' } },
            linkedScenarioId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Channel: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            displayName: { type: 'string' },
            type: { type: 'string', enum: ['group', 'dm'] },
            description: { type: 'string' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  joinedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            messageCount: { type: 'number' },
            lastMessageAt: { type: 'string', format: 'date-time' },
            vectorMemory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'number' },
                  summary: { type: 'string' },
                  keyDecisions: { type: 'array', items: { type: 'string' } },
                  embedding: { type: 'array', items: { type: 'number' } },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateMessageDto: {
          type: 'object',
          required: ['channelId', 'content'],
          properties: {
            channelId: { type: 'string' },
            content: { type: 'string' },
            contentType: { type: 'string', enum: ['text', 'voice'] },
            voiceUrl: { type: 'string' }
          }
        },
        CreateChannelDto: {
          type: 'object',
          required: ['name', 'displayName', 'type', 'members'],
          properties: {
            name: { type: 'string' },
            displayName: { type: 'string' },
            type: { type: 'string', enum: ['group', 'dm'] },
            description: { type: 'string' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' }
                }
              }
            }
          }
        },
        Scenario: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' }
          }
        },
        VectorSearchQuery: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string' },
            threshold: { type: 'number', default: 0.7 },
            limit: { type: 'number', default: 5 }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            services: {
              type: 'object',
              properties: {
                api: { type: 'string' },
                mastra: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/controllers/*.ts', './src/app.ts'], // files containing annotations
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };
