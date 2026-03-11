import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    type: { type: String, enum: ["group", "dm"], required: true },
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
const ChannelModal = model("Channel", schema);

export { ChannelModal };
