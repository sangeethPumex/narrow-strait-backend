import { Schema, model, Document } from 'mongoose';
import { Channel } from '../types/channel.js';

interface ChannelDoc extends Omit<Channel, '_id'>, Document {}

const schema = new Schema<ChannelDoc>(
  {
    name: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    type: { type: String, enum: ['group', 'dm'], required: true },
    description: String,
    members: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        role: String,
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    messageCount: { type: Number, default: 0 },
    lastMessageAt: Date,
    vectorMemory: [
      {
        month: Number,
        summary: String,
        keyDecisions: [String],
        embedding: [Number],
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const ChannelModal = model<ChannelDoc>('Channel', schema);

export const channelModalCRUD = {
  async create(data: Partial<ChannelDoc>) {
    return ChannelModal.create(data);
  },
  async findById(id: string) {
    return ChannelModal.findById(id);
  },
  async findByName(name: string) {
    return ChannelModal.findOne({ name });
  },
  async findAll() {
    return ChannelModal.find().sort({ createdAt: -1 });
  },
  async updateMessageCount(channelId: string) {
    return ChannelModal.findByIdAndUpdate(
      channelId,
      { $inc: { messageCount: 1 }, lastMessageAt: new Date() },
      { new: true }
    );
  },
  async addVectorMemory(
    channelId: string,
    month: number,
    summary: string,
    keyDecisions: string[],
    embedding: number[]
  ) {
    return ChannelModal.findByIdAndUpdate(
      channelId,
      { $push: { vectorMemory: { month, summary, keyDecisions, embedding } } },
      { new: true }
    );
  }
};
