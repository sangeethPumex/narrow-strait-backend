import { getAgentConfig, getAgentResponse, streamAgentResponse } from '../mastra/index.js';
import { getAgentInstance } from '../mastra/index.js';
import { messageService } from './message.service.js';
import { channelService } from './channel.service.js';
import { buildAgentPrompt } from '../utils/prompt.utils.js';
import { companyStateCRUD } from '../modals/index.js';
import {
  runConversationalDiscussion,
  type ConversationalMessage
} from '../mastra/workflows/conversational-discussion.js';
import { summaryService } from './summary.service.js';
import { getIO } from '../socket/io.js';

export const agentService = {
  async triggerDiscussion(
    channelId: string,
    scenario: { title: string; description: string },
    agentIds?: string[],
    month = 1,
    year = 1
  ) {
    const channel = await channelService.getChannel(channelId);
    if (!channel) throw new Error('Channel not found');

    const targetAgentIds =
      agentIds ||
      channel.members
        .filter(m => m.id !== 'user' && m.id !== 'ceo-sarah')
        .map(m => m.id)
        .filter(id => getAgentConfig(id));

    const { summaries } = await summaryService.getChannelContext(channelId);
    const recentMessages = await messageService.getChannelMessagesLean(channelId, 20);

    const recentContext = recentMessages
      .map(m => `${m.authorName}: ${m.content}`)
      .join('\n');

    const summaryContext =
      summaries.length > 0
        ? summaries
            .map((s: { date: Date; summary: string }) =>
              `[${new Date(s.date).toDateString()}] ${s.summary}`
            )
            .join('\n')
        : '';

    const context = summaryContext
      ? `## Historical Context (summarized)\n${summaryContext}\n\n## Live Messages\n${recentContext}`
      : recentContext;

    const companyState = await companyStateCRUD.getOrCreateDefault();

    const createdMessages: Awaited<ReturnType<typeof messageService.createMessage>>[] = [];
    const threadHistory: Array<{ agentName: string; content: string }> = [];

    for (const agentId of targetAgentIds) {
      const config = getAgentConfig(agentId);
      if (!config) continue;

      try {
        // Pass what previous agents said so this agent can differ/disagree
        const prompt = buildAgentPrompt(agentId, scenario, companyState, context, threadHistory);

        // Create placeholder message immediately - frontend shows it right away
        const placeholder = await messageService.createMessage({
          channelId,
          content: '...',
          authorId: agentId,
          authorName: config.name,
          authorRole: config.role,
          authorAvatar: config.icon,
          authorColor: config.color,
          isAgentMessage: true,
          month,
          year,
        });

        const messageId = (placeholder as any)._id?.toString();

        // Emit the placeholder so it appears in chat immediately
        try {
          getIO().to(channelId).emit('message_posted',
            (placeholder as any).toObject ? (placeholder as any).toObject() : placeholder
          );
          // Clear typing - message bubble is now visible
          getIO().to(channelId).emit('agent_typing', {
            agentId,
            agentName: config.name,
            isTyping: false,
          });
        } catch (_) {}

        // Stream content in - emit each chunk so frontend updates live
        let finalContent = '';
        let lastEmitLength = 0;
        const CHUNK_EMIT_THRESHOLD = 8;

        try {
          finalContent = await streamAgentResponse(agentId, prompt, (chunk, fullSoFar) => {
            // Throttle emissions - don't emit every single token
            if (fullSoFar.length - lastEmitLength >= CHUNK_EMIT_THRESHOLD || chunk.includes(' ')) {
              lastEmitLength = fullSoFar.length;
              try {
                getIO().to(channelId).emit('message_update', {
                  messageId,
                  content: fullSoFar,
                  agentId,
                });
              } catch (_) {}
            }
          });
        } catch (streamErr) {
          console.error(`Stream error for ${agentId}:`, (streamErr as Error).message);
          // Fall back to non-streaming
          finalContent = await getAgentResponse(agentId, prompt).catch(() => '');
        }

        if (!finalContent || finalContent.trim() === '') {
          // Delete the placeholder if we got nothing
          try {
            const { MessageModal } = await import('../modals/message.modal.js');
            await MessageModal.deleteOne({ _id: messageId });
            getIO().to(channelId).emit('message_deleted', { messageId });
          } catch (_) {}
          continue;
        }

        // Save final content to DB
        try {
          const { MessageModal } = await import('../modals/message.modal.js');
          await MessageModal.findByIdAndUpdate(messageId, { content: finalContent });
        } catch (_) {}

        // Emit finalized message so frontend replaces the streaming version
        try {
          getIO().to(channelId).emit('message_finalized', {
            messageId,
            content: finalContent,
            agentId,
          });
        } catch (_) {}

        createdMessages.push(placeholder);

        // Add to thread so next agent can react/disagree
        if (finalContent && finalContent.trim()) {
          threadHistory.push({ agentName: config.name, content: finalContent });
        }

        // Small gap between agents
        const delay = 300 + Math.floor(Math.random() * 400);
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (err) {
        try {
          getIO().to(channelId).emit('agent_typing', { agentId, isTyping: false });
        } catch (_) {}
        console.error(`Agent ${agentId} failed:`, (err as Error).message);
      }
    }

    return createdMessages;
  },

  async triggerConversationalDiscussion(
    channelId: string,
    scenario: { title: string; description: string },
    agentIds?: string[],
    rounds = 2,
    month = 1,
    year = 1
  ) {
    const channel = await channelService.getChannel(channelId);
    if (!channel) throw new Error('Channel not found');

    const targetAgentIds =
      agentIds ||
      channel.members
        .filter(m => m.id !== 'user' && m.id !== 'ceo-sarah')
        .map(m => m.id)
        .filter(id => getAgentConfig(id));

    const companyState = await companyStateCRUD.getOrCreateDefault();

    const createdMessages: Awaited<ReturnType<typeof messageService.createMessage>>[] = [];

    await runConversationalDiscussion(
      {
        agentIds: targetAgentIds,
        scenario,
        channelId,
        rounds
      },
      async ({ agentId, threadHistory }) => {
        const config = getAgentConfig(agentId);
        if (!config) throw new Error(`Agent config not found for ${agentId}`);

        const agent = getAgentInstance(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found`);

        try {
          getIO().to(channelId).emit('agent_typing', {
            agentId,
            agentName: config.name,
            isTyping: true
          });
        } catch (_) {}

        let content = '';
        try {
          const fullPrompt = buildAgentPrompt(agentId, scenario, companyState, '', threadHistory);
          content = await getAgentResponse(agentId, fullPrompt);
        } finally {
          try {
            getIO().to(channelId).emit('agent_typing', {
              agentId,
              agentName: config.name,
              isTyping: false
            });
          } catch (_) {}
        }

        const message = await messageService.createMessage({
          channelId,
          content,
          authorId: agentId,
          authorName: config.name,
          authorRole: config.role,
          authorAvatar: config.icon,
          authorColor: config.color,
          isAgentMessage: true,
          month,
          year
        });

        try {
          getIO().to(channelId).emit('message_posted', message.toObject ? message.toObject() : message);
        } catch (e) {
          console.warn('Socket emit skipped — io not ready');
        }

        createdMessages.push(message);

        // After each agent responds, wait 500ms before next call
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
          agentId,
          agentName: config.name,
          content
        };
      }
    );

    return createdMessages;
  }
};
