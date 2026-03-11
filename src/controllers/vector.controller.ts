import { Request, Response } from 'express';
import { vectorService } from '../services/vector.service.js';
import { embedWithOllama } from '../utils/vector.utils.js';

export const vectorController = {
  /**
   * @swagger
   * /api/channels/{channelId}/vector-search:
   *   post:
   *     summary: Search for similar messages using vector similarity
   *     tags: [Vector Search]
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VectorSearchQuery'
   *     responses:
   *       200:
   *         description: Similar messages found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 query:
   *                   type: string
   *                 similar:
   *                   type: array
   *                   items:
   *                     allOf:
   *                       - $ref: '#/components/schemas/Message'
   *                       - type: object
   *                         properties:
   *                           similarity:
   *                             type: number
   *                 count:
   *                   type: number
   */
  async findSimilarMessages(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const { query, threshold = 0.7, limit = 5 } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query required' });
      }
      const queryVector = await embedWithOllama(query);
      const similar = await vectorService.findSimilarMessages(
        channelId,
        queryVector,
        threshold,
        limit
      );
      res.json({ query, similar, count: similar.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
};
