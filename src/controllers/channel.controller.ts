import { Request, Response } from 'express';
import { channelService } from '../services/channel.service.js';

export const channelController = {
  /**
   * @swagger
   * /api/channels:
   *   get:
   *     summary: Get all channels
   *     tags: [Channels]
   *     responses:
   *       200:
   *         description: List of channels
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 channels:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Channel'
   *                 count:
   *                   type: number
   */
  async getChannels(req: Request, res: Response) {
    try {
      const channels = await channelService.getAllChannels();
      res.json({ channels, count: channels.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  /**
   * @swagger
   * /api/channels/{channelId}:
   *   get:
   *     summary: Get a specific channel
   *     tags: [Channels]
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Channel details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Channel'
   *       404:
   *         description: Channel not found
   */
  async getChannel(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const channel = await channelService.getChannel(channelId);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });
      res.json(channel);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  /**
   * @swagger
   * /api/channels:
   *   post:
   *     summary: Create a new channel
   *     tags: [Channels]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateChannelDto'
   *     responses:
   *       201:
   *         description: Channel created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Channel'
   */
  async createChannel(req: Request, res: Response) {
    try {
      const channel = await channelService.createChannel(req.body);
      res.status(201).json(channel);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
};
