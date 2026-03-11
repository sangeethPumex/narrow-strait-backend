import { Schema, model, Document } from 'mongoose';

export interface CompanyState {
  month: number;
  year: number;
  arr: number;
  burnRate: number;
  runway: number;
  headcount: number;
  openIssues: string[];
  lastUpdated: Date;
}

interface CompanyStateDoc extends CompanyState, Document {}

const schema = new Schema<CompanyStateDoc>(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    arr: { type: Number, required: true, default: 2400000 },
    burnRate: { type: Number, required: true, default: 430000 },
    runway: { type: Number, required: true, default: 16 },
    headcount: { type: Number, required: true, default: 34 },
    openIssues: { type: [String], default: [] },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const CompanyStateModal = model<CompanyStateDoc>('CompanyState', schema);

export const companyStateCRUD = {
  async getCurrent(): Promise<CompanyState | null> {
    return CompanyStateModal.findOne().sort({ year: -1, month: -1 }).lean();
  },

  async upsertState(data: Partial<CompanyState>): Promise<CompanyState> {
    const filter = { month: data.month, year: data.year };
    const update = { ...data, lastUpdated: new Date() };
    return CompanyStateModal.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }).lean() as Promise<CompanyState>;
  },

  async getOrCreateDefault(): Promise<CompanyState> {
    const existing = await companyStateCRUD.getCurrent();
    if (existing) return existing;

    const now = new Date();
    return companyStateCRUD.upsertState({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      arr: 2400000,
      burnRate: 430000,
      runway: 16,
      headcount: 34,
      openIssues: ['Lead backend eng resigned', 'Q2 ARR target missed by $600K'],
      lastUpdated: now
    });
  }
};
