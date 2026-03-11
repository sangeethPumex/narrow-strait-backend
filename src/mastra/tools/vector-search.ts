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
      const { MessageModal } = await import('../../modals/message.modal.js');
      const messages = await MessageModal.find({
        channelId,
        vectorEmbedding: { $ne: [], $exists: true }
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return { success: true, messages };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
});
