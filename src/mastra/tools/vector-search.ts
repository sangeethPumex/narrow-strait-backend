import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const vectorSearchTool = createTool({
  id: 'vector-search',
  description: 'Search similar messages in a channel using embeddings',
  inputSchema: z.object({
    channelId: z.string(),
    query: z.string(),
    limit: z.number().default(5),
    threshold: z.number().default(0.7)
  }),
  execute: async ({ channelId, limit }: { channelId: string; limit: number; query: string; threshold: number }) => {
    try {
      const { MessageVectorModal } = await import('../../modals/message-vector.modal.js');
      const { MessageModal } = await import('../../modals/message.modal.js');

      const vectors = await MessageVectorModal.find({ channelId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const messages = await MessageModal.find({
        _id: { $in: vectors.map(v => v.messageId) }
      }).lean();

      return { success: true, messages };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
});
