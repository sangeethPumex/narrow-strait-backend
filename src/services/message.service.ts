import { messageModalCRUD } from '../modals/message.modal.js';
import { channelModalCRUD } from '../modals/channel.modal.js';
import { embedWithOllama } from '../utils/vector.utils.js';

export const messageService = {
  async createMessage(data: {
    channelId: string;
    content: string;
    contentType?: 'text' | 'voice' | 'system';
    voiceUrl?: string;
    authorId: string;
    authorName: string;
    authorRole?: string;
    authorAvatar?: string;
    authorColor?: string;
    isAgentMessage?: boolean;
    month: number;
    year: number;
    mentionedAgents?: string[];
  }) {
    const vectorEmbedding = await embedWithOllama(data.content);
    const message = await messageModalCRUD.create({
      ...data,
      vectorEmbedding,
      timestamp: new Date()
    });
    await channelModalCRUD.updateMessageCount(data.channelId);
    return message;
  },

  async getChannelMessages(channelId: string, limit = 50, offset = 0) {
    return messageModalCRUD.findByChannel(channelId, limit, offset);
  },

  async addReaction(messageId: string, emoji: string, userId: string) {
    return messageModalCRUD.addReaction(messageId, emoji, userId);
  }
};
