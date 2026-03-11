import { Schema, model, Document, Model } from 'mongoose';
import { cosineSimilarity } from '../utils/vector.utils.js';

export interface DailySummary {
  _id?: string;
  channelId: string;
  date: Date;
  summary: string;
  keyPoints: string[];
  messageCount: number;
  agentsInvolved: string[];
  embedding: number[];
  createdAt: Date;
}

type DailySummarySearchResult = DailySummary & { similarity: number };

interface DailySummaryDoc extends Omit<DailySummary, '_id'>, Document {}

interface DailySummaryModel extends Model<DailySummaryDoc> {
  vectorSearch(
    channelId: string,
    queryVector: number[],
    limit?: number
  ): Promise<DailySummarySearchResult[]>;
}

const schema = new Schema<DailySummaryDoc>(
  {
    channelId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    summary: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    messageCount: { type: Number, required: true },
    agentsInvolved: { type: [String], default: [] },
    embedding: { type: [Number], default: [] }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

schema.index({ channelId: 1, date: -1 });
schema.index({ channelId: 1, date: 1 }, { unique: true });

schema.statics.vectorSearch = async function vectorSearch(
  channelId: string,
  queryVector: number[],
  limit = 3
): Promise<DailySummarySearchResult[]> {
  const summaries = await this.find({ channelId }).lean();

  return summaries
    .map((summary: DailySummary) => ({
      ...summary,
      similarity: cosineSimilarity(queryVector, summary.embedding || [])
    }))
    .filter((summary: DailySummarySearchResult) => summary.similarity > 0.5)
    .sort(
      (a: DailySummarySearchResult, b: DailySummarySearchResult) =>
        b.similarity - a.similarity
    )
    .slice(0, limit);
};

export const DailySummaryModal = model<DailySummaryDoc, DailySummaryModel>(
  'DailySummary',
  schema
);

export const dailySummaryCRUD = {
  async create(data: Partial<DailySummaryDoc>) {
    return DailySummaryModal.create(data);
  },
  async findByChannel(channelId: string, limit: number = 7) {
    return DailySummaryModal.find({ channelId }).sort({ date: -1 }).limit(limit).lean();
  },
  async findByDateRange(channelId: string, startDate: Date, endDate: Date) {
    return DailySummaryModal.find({
      channelId,
      date: { $gte: startDate, $lte: endDate }
    })
      .sort({ date: -1 })
      .lean();
  },
  async upsertForDate(channelId: string, date: Date, data: Partial<DailySummaryDoc>) {
    return DailySummaryModal.findOneAndUpdate(
      { channelId, date },
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  },
  async vectorSearch(channelId: string, queryVector: number[], limit = 3) {
    return DailySummaryModal.vectorSearch(channelId, queryVector, limit);
  }
};
