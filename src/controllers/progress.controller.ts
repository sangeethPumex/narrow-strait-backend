import { Request, Response } from 'express';
import { recordProgressEvent } from '../mastra/rag/index.js';

export const progressController = {
  async recordProgress(req: Request, res: Response) {
    try {
      const { type, description } = req.body;
      if (!type || !description) {
        return res.status(400).json({ error: 'type and description required' });
      }

      await recordProgressEvent({
        type,
        description,
        recordedAt: new Date().toISOString(),
        recordedBy: 'user',
      });

      return res.status(201).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
};
