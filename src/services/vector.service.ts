import { MessageModal } from '../modals/message.modal.js';
import { embedWithOllama, cosineSimilarity } from '../utils/vector.utils.js';

export const vectorService = {
  async findSimilarMessages(
    channelId: string,
    queryVector: number[],
    threshold = 0.7,
    limit = 5
  ) {
    const messages = await MessageModal.find({
      channelId,
      vectorEmbedding: { $ne: [], $exists: true }
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    return messages
      .map(m => ({
        ...m,
        similarity: cosineSimilarity(queryVector, m.vectorEmbedding || [])
      }))
      .filter(m => m.similarity > threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  },

  async embedAllMessages(channelId: string) {
    const messages = await MessageModal.find({
      channelId,
      $or: [
        { vectorEmbedding: { $exists: false } },
        { vectorEmbedding: { $size: 0 } }
      ]
    });

    for (const message of messages) {
      const embedding = await embedWithOllama(message.content);
      message.vectorEmbedding = embedding;
      await message.save();
    }

    return messages.length;
  }
};
