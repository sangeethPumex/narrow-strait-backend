import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const channelContextTool = createTool({
  id: "channel-context",
  description: "Get recent messages and context from a channel",
  inputSchema: z.object({
    channelId: z.string(),
    limit: z.number().default(10)
  }),
  execute: async ({ channelId, limit }) => {
    try {
      const { MessageModal } = await import('../message.modal.mjs');
      const { ChannelModal } = await import('../channel.modal.mjs');
      const channel = await ChannelModal.findById(channelId);
      const messages = await MessageModal.find({ channelId }).sort({ timestamp: -1 }).limit(limit).lean();
      return {
        success: true,
        channel: {
          name: channel?.name,
          members: channel?.members.map((m) => m.name)
        },
        messages: messages.map((m) => ({
          author: m.authorName,
          content: m.content
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

export { channelContextTool };
