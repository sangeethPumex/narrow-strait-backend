import { model, Schema } from 'mongoose';

const schema = new Schema(
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
      enum: ["text", "voice", "system"],
      default: "text"
    },
    voiceUrl: String,
    isAgentMessage: { type: Boolean, default: false },
    agentPersonality: {
      tone: String,
      confidence: { type: Number, min: 0, max: 1 },
      certainty: String
    },
    vectorEmbedding: [Number],
    reactions: [{ emoji: String, users: [String] }],
    mentionedAgents: [String],
    linkedScenarioId: String,
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
schema.index({ channelId: 1, timestamp: -1 });
schema.index({ authorId: 1, channelId: 1 });
const MessageModal = model("Message", schema);

export { MessageModal };
