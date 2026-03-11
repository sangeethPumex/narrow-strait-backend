import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { messageService } from '../services/message.service.js';

export const messageController = {
  /**
   * @swagger
   * /api/channels/{channelId}/messages:
   *   post:
   *     summary: Send a message to a channel
   *     tags: [Messages]
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
   *             $ref: '#/components/schemas/CreateMessageDto'
   *     responses:
   *       201:
   *         description: Message sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const { content, contentType } = req.body;
      const now = new Date();

      const message = await messageService.createMessage({
        channelId,
        content,
        contentType,
        authorId: 'user',
        authorName: 'You',
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Invalid message payload',
          details: error.issues.map(issue => issue.message)
        });
        return;
      }

      res.status(500).json({ error: (error as Error).message });
    }
  },

  /**
   * @swagger
   * /api/channels/{channelId}/messages:
   *   get:
   *     summary: Get messages from a channel
   *     tags: [Messages]
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: List of messages
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
  async getMessages(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const messages = await messageService.getChannelMessages(channelId, limit, offset);
      res.json({ messages, count: messages.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  /**
   * @swagger
   * /api/messages/{messageId}/reactions:
   *   post:
   *     summary: Add a reaction to a message
   *     tags: [Messages]
   *     parameters:
   *       - in: path
   *         name: messageId
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
   *               - emoji
   *             properties:
   *               emoji:
   *                 type: string
   *     responses:
   *       200:
   *         description: Reaction added successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   */
  async reactToMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const message = await messageService.addReaction(messageId, emoji, 'user');
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
};
