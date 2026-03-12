import { Request, Response } from 'express';
import { ingestDocument } from '../mastra/rag/index.js';

export const documentController = {
  async ingest(req: Request, res: Response) {
    try {
      const { title, content, docType } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'title and content required' });
      }

      const chunkCount = await ingestDocument({
        title,
        content,
        docType: docType ?? 'general',
        uploadedAt: new Date().toISOString(),
      });

      return res.status(201).json({ ok: true, chunks: chunkCount });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
};
