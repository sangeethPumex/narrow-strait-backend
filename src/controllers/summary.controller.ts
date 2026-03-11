import { Request, Response } from 'express';
import { summaryService } from '../services/summary.service.js';

export const summaryController = {
  /**
   * @swagger
   * /api/channels/{channelId}/summarize:
   *   post:
   *     summary: Summarize old channel messages into daily summaries
   *     tags: [Summaries]
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Summarization result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 summarized:
   *                   type: number
   *                 skipped:
   *                   type: boolean
   *                 reason:
   *                   type: string
   */
  async summarizeChannel(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const status = await summaryService.getSummarizationStatus(channelId);

      if (!status.canSummarize) {
        return res.json({
          summarized: 0,
          skipped: true,
          reason: status.reason
        });
      }

      const summarized = await summaryService.summarizeOldMessages(channelId);
      return res.json({
        summarized,
        skipped: summarized === 0
      });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  /**
   * @swagger
   * /api/channels/{channelId}/context:
   *   get:
   *     summary: Get channel context from recent messages and summaries
   *     tags: [Summaries]
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Channel context payload
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 recentMessages:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Message'
   *                 summaries:
   *                   type: array
   *                   items:
   *                     type: object
   *                 totalSummaryDays:
   *                   type: number
   */
  async getChannelContext(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const { recentMessages, summaries } = await summaryService.getChannelContext(channelId);

      return res.json({
        recentMessages,
        summaries,
        totalSummaryDays: summaries.length
      });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
};
