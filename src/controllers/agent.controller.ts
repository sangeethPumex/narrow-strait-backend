import { Request, Response } from 'express';
import { agentService } from '../services/agent.service.js';
import { channelService } from '../services/channel.service.js';
import { parseMentions, resolveRespondingAgents } from '../utils/mention.utils.js';

export const agentController = {
  /**
   * @swagger
   * /api/channels/{channelId}/trigger-discussion:
   *   post:
   *     summary: Trigger a multi-agent discussion
   *     tags: [Agents]
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
   *             type: object
   *             required:
   *               - scenario
   *             properties:
   *               scenario:
   *                 $ref: '#/components/schemas/Scenario'
   *               agentIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               month:
   *                 type: number
   *               year:
   *                 type: number
   *     responses:
   *       201:
   *         description: Discussion triggered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 messages:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Message'
   *                 count:
   *                   type: number
   */
  async startDiscussion(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const { scenario, agentIds, month, year } = req.body;
      if (!scenario) {
        return res.status(400).json({ error: 'Scenario required' });
      }
      const messages = await agentService.triggerDiscussion(
        channelId,
        scenario,
        agentIds,
        month,
        year
      );
      res.status(201).json({ messages, count: messages.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async startConversationalDiscussion(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const { scenario, agentIds, rounds = 2, month, year } = req.body;
      if (!scenario) {
        return res.status(400).json({ error: 'Scenario required' });
      }

      const messages = await agentService.triggerConversationalDiscussion(
        channelId,
        scenario,
        agentIds,
        rounds,
        month,
        year
      );

      res.status(201).json({ messages, count: messages.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async askAgent(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const { message, agentIds, month, year } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'message is required' });
      }

      const channel = await channelService.getChannel(channelId);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });

      const channelAgentIds = channel.members
        .map((m: { id: string }) => m.id)
        .filter((id: string) => id !== 'user' && id !== 'ceo-sarah');

      const targetAgentIds =
        agentIds || parseMentions(message) || resolveRespondingAgents(message, channelAgentIds);

      if (targetAgentIds.length === 0) {
        return res.status(400).json({
          error: 'No agents resolved. Use @mention or provide agentIds.',
          hint: 'Try: @marcus, @priya, @james, @alex, @market, @chaos, @all, @board'
        });
      }

      const now = new Date();
      const messages = await agentService.triggerDiscussion(
        channelId,
        { title: 'Direct Question', description: message },
        targetAgentIds,
        month || now.getMonth() + 1,
        year || now.getFullYear()
      );

      res.status(201).json({ messages, count: messages.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
};
