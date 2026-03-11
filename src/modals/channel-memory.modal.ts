import { Schema, model, Document } from 'mongoose';

interface ChannelMemoryDoc extends Document {
  agentId: string;
  channelId: string;
  participationStyle?: string;
  recentPositions?: string[];
  confidence?: number;
  participationCount: number;
  successRate?: number;
  overturnedCount: number;
}

const schema = new Schema<ChannelMemoryDoc>(
  {
    agentId: { type: String, required: true },
    channelId: { type: String, required: true },
    participationStyle: String,
    recentPositions: [String],
    confidence: { type: Number, min: 0, max: 1 },
    participationCount: { type: Number, default: 0 },
    successRate: { type: Number, min: 0, max: 1 },
    overturnedCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

schema.index({ agentId: 1, channelId: 1 }, { unique: true });

export const ChannelMemoryModal = model<ChannelMemoryDoc>('ChannelMemory', schema);

export const channelMemoryCRUD = {
  async getOrCreate(agentId: string, channelId: string) {
    const existing = await ChannelMemoryModal.findOne({ agentId, channelId });
    return existing || ChannelMemoryModal.create({ agentId, channelId });
  },
  async updateParticipation(agentId: string, channelId: string) {
    return ChannelMemoryModal.findOneAndUpdate(
      { agentId, channelId },
      { $inc: { participationCount: 1 } },
      { new: true }
    );
  }
};
