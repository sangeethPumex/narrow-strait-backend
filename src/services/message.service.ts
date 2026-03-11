import { MessageModal, messageModalCRUD } from '../modals/message.modal.js';
import { ChannelModal } from '../modals/channel.modal.js';
import { messageVectorCRUD } from '../modals/message-vector.modal.js';
import { embedWithOllama } from '../utils/vector.utils.js';
import { z } from 'zod';

const createMessageSchema = z.object({
  channelId: z.string().trim().min(1, 'Channel ID is required'),
  content: z.string().trim().min(1, 'Message content is required'),
  contentType: z.enum(['text', 'voice', 'system']).default('text'),
  voiceUrl: z.string().trim().min(1).optional(),
  authorId: z.string().trim().min(1, 'Author ID is required'),
  authorName: z.string().trim().min(1, 'Author name is required'),
  authorRole: z.string().trim().min(1).optional(),
  authorAvatar: z.string().trim().min(1).optional(),
  authorColor: z.string().trim().min(1).optional(),
  isAgentMessage: z.boolean().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1),
  mentionedAgents: z.array(z.string().trim().min(1)).optional()
});

export type CreateMessageInput = z.input<typeof createMessageSchema>;

export const messageService = {
  async createMessage(data: CreateMessageInput) {
    const parsedData = createMessageSchema.parse(data);
    const shouldEmbed =
      parsedData.isAgentMessage === true ||
      parsedData.content.includes('?') ||
      parsedData.contentType === 'system';

    const message = await messageModalCRUD.create({
      ...parsedData,
      timestamp: new Date()
    });

    if (shouldEmbed && process.env.ENABLE_EMBEDDINGS === 'true') {
      embedWithOllama(parsedData.content)
        .then(embedding => {
          if (embedding.length > 0) {
            return messageVectorCRUD.create(
              message._id.toString(),
              parsedData.channelId,
              embedding
            );
          }
        })
        .catch(err => console.warn('Embedding save failed:', err.message));
    }

    await ChannelModal.findByIdAndUpdate(parsedData.channelId, {
      $inc: {
        messageCount: 1,
        'stats.totalMessages': 1,
        ...(parsedData.isAgentMessage
          ? { 'stats.agentMessages': 1 }
          : { 'stats.userMessages': 1 })
      },
      ...(parsedData.isAgentMessage
        ? { 'stats.lastAgentAt': new Date() }
        : { 'stats.lastUserAt': new Date() }),
      lastMessageAt: new Date()
    });

    return message;
  },

  async getChannelMessages(channelId: string, limit = 50, offset = 0) {
    return messageModalCRUD.findByChannel(channelId, limit, offset);
  },

  async getChannelMessagesLean(channelId: string, limit = 20) {
    return MessageModal.find({ channelId })
      .select('authorName content timestamp isAgentMessage authorRole')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async addReaction(messageId: string, emoji: string, userId: string) {
    return messageModalCRUD.addReaction(messageId, emoji, userId);
  },

  async cleanGarbageMessages(channelId: string) {
    return MessageModal.deleteMany({
      channelId,
      isAgentMessage: true,
      content: { $regex: /\{"type":"function"/ }
    });
  }
};
