import { Schema, model, Document } from 'mongoose';
import { Message } from '../types/message.js';

interface MessageDoc extends Omit<Message, '_id'>, Document {}

const schema = new Schema<MessageDoc>(
  {
    channelId: { type: String, required: true, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    authorRole: String,
    authorAvatar: String,
    authorColor: String,
    content: { type: String, required: true },
    contentType: {
      type: String,
      enum: ['text', 'voice', 'system'],
      default: 'text'
    },
    voiceUrl: String,
    isAgentMessage: { type: Boolean, default: false },
    agentPersonality: {
      tone: String,
      confidence: { type: Number, min: 0, max: 1 },
      certainty: String
    },
    reactions: [{ emoji: String, users: [String] }],
    mentionedAgents: [String],
    linkedScenarioId: String,
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

schema.index({ channelId: 1, timestamp: -1 });
schema.index({ authorId: 1, channelId: 1 });
schema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: parseInt(process.env.MESSAGE_TTL_DAYS || '30') * 86400,
    partialFilterExpression: { isAgentMessage: false }
  }
);
schema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: parseInt(process.env.AGENT_MESSAGE_TTL_DAYS || '90') * 86400,
    partialFilterExpression: { isAgentMessage: true }
  }
);

export const MessageModal = model<MessageDoc>('Message', schema);

export const messageModalCRUD = {
  async create(data: Partial<MessageDoc>) {
    return MessageModal.create(data);
  },
  async findById(id: string) {
    return MessageModal.findById(id);
  },
  async findByChannel(channelId: string, limit: number = 50, offset: number = 0) {
    return MessageModal.find({ channelId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean();
  },
  async countByChannel(channelId: string) {
    return MessageModal.countDocuments({ channelId });
  },
  async findByChannelDateRange(channelId: string, startDate: Date, endDate: Date) {
    return MessageModal.find({
      channelId,
      timestamp: { $gte: startDate, $lte: endDate }
    })
      .sort({ timestamp: 1 })
      .lean();
  },
  async findEligibleForSummary(channelId: string, olderThan: Date, weekStart: Date) {
    return MessageModal.find({
      channelId,
      $and: [{ timestamp: { $lt: olderThan } }, { timestamp: { $lt: weekStart } }]
    })
      .sort({ timestamp: 1 })
      .lean();
  },
  async deleteManyByIds(ids: string[]) {
    return MessageModal.deleteMany({ _id: { $in: ids } });
  },
  async addReaction(messageId: string, emoji: string, userId: string) {
    const msg = await MessageModal.findById(messageId);
    if (!msg) throw new Error('Message not found');
    const reaction = msg.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      if (!reaction.users.includes(userId)) reaction.users.push(userId);
    } else {
      msg.reactions.push({ emoji, users: [userId] });
    }
    return msg.save();
  }
};
