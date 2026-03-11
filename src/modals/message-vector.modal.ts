import { Schema, model, Document } from 'mongoose';

interface MessageVectorDoc extends Document {
  messageId: string;
  channelId: string;
  embedding: number[];
  createdAt: Date;
}

const schema = new Schema<MessageVectorDoc>(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true, index: true },
    embedding: { type: [Number], required: true }
  },
  { timestamps: true }
);

schema.index({ channelId: 1, createdAt: -1 });

export const MessageVectorModal = model<MessageVectorDoc>('MessageVector', schema);

export const messageVectorCRUD = {
  async create(messageId: string, channelId: string, embedding: number[]) {
    return MessageVectorModal.create({ messageId, channelId, embedding });
  },

  async findByChannel(channelId: string) {
    return MessageVectorModal.find({ channelId }).lean();
  },

  async findByMessageId(messageId: string) {
    return MessageVectorModal.findOne({ messageId }).lean();
  },

  async deleteByMessageId(messageId: string) {
    return MessageVectorModal.deleteOne({ messageId });
  }
};
