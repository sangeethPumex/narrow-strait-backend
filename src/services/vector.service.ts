import { MessageModal } from '../modals/message.modal.js';
import { MessageVectorModal, messageVectorCRUD } from '../modals/message-vector.modal.js';
import { embedWithOllama, cosineSimilarity } from '../utils/vector.utils.js';

export const vectorService = {
  async findSimilarMessages(
    channelId: string,
    queryVector: number[],
    threshold = 0.7,
    limit = 5
  ) {
    const vectors = await MessageVectorModal.find({ channelId }).lean();

    const ranked = vectors
      .map(v => ({
        messageId: v.messageId,
        similarity: cosineSimilarity(queryVector, v.embedding)
      }))
      .filter(v => v.similarity > threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    if (ranked.length === 0) return [];

    const messageIds = ranked.map(r => r.messageId);
    const messages = await MessageModal.find({
      _id: { $in: messageIds }
    }).lean();

    return ranked
      .map(r => ({
        ...messages.find(m => m._id.toString() === r.messageId),
        similarity: r.similarity
      }))
      .filter(Boolean);
  },

  async embedAllMessages(channelId: string) {
    const messages = await MessageModal.find({ channelId }).select('_id content');
    const existingVectors = await MessageVectorModal.find({ channelId })
      .select('messageId')
      .lean();
    const existingIds = new Set(existingVectors.map(v => v.messageId));

    let embeddedCount = 0;

    for (const message of messages) {
      const messageId = message._id.toString();
      if (existingIds.has(messageId)) continue;

      const embedding = await embedWithOllama(message.content);
      if (embedding.length === 0) continue;

      await messageVectorCRUD.create(messageId, channelId, embedding);
      embeddedCount += 1;
    }

    return embeddedCount;
  }
};
