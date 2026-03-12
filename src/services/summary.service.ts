import { channelModalCRUD, dailySummaryCRUD, messageModalCRUD } from '../modals/index.js';
import { embedWithOllama } from '../utils/vector.utils.js';
import { storeChannelMemory } from '../mastra/rag/index.js';

type SummarizationStatus = {
  canSummarize: boolean;
  reason?: string;
  eligibleCount: number;
};

function getUtcDayStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getCurrentWeekStartUtc(now: Date) {
  const day = now.getUTCDay();
  const diffFromMonday = (day + 6) % 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - diffFromMonday);
  return start;
}

function getFirstSentence(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return '';

  const sentenceMatch = trimmed.match(/^[^.!?]+[.!?]?/);
  return (sentenceMatch?.[0] || trimmed).trim();
}

export const summaryService = {
  async getSummarizationStatus(channelId: string): Promise<SummarizationStatus> {
    const totalMessages = await messageModalCRUD.countByChannel(channelId);
    if (totalMessages <= 100) {
      return {
        canSummarize: false,
        reason: 'Channel has 100 or fewer total messages',
        eligibleCount: 0
      };
    }

    const now = new Date();
    const olderThan = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStart = getCurrentWeekStartUtc(now);

    const eligibleMessages = await messageModalCRUD.findEligibleForSummary(
      channelId,
      olderThan,
      weekStart
    );

    if (eligibleMessages.length === 0) {
      return {
        canSummarize: false,
        reason: 'No messages are older than 7 days outside the current calendar week',
        eligibleCount: 0
      };
    }

    if (eligibleMessages.length < 5) {
      return {
        canSummarize: false,
        reason: 'Fewer than 5 eligible messages to summarize',
        eligibleCount: eligibleMessages.length
      };
    }

    return { canSummarize: true, eligibleCount: eligibleMessages.length };
  },

  async summarizeOldMessages(channelId: string) {
    const status = await this.getSummarizationStatus(channelId);
    if (!status.canSummarize) return 0;

    const now = new Date();
    const olderThan = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStart = getCurrentWeekStartUtc(now);

    const eligibleMessages = await messageModalCRUD.findEligibleForSummary(
      channelId,
      olderThan,
      weekStart
    );

    if (eligibleMessages.length < 5) return 0;

    const groupedByDay = new Map<string, typeof eligibleMessages>();
    for (const message of eligibleMessages) {
      const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();
      const dayStart = getUtcDayStart(timestamp).toISOString();
      const existing = groupedByDay.get(dayStart) || [];
      existing.push(message);
      groupedByDay.set(dayStart, existing);
    }

    let summarizedCount = 0;
    const deletedIds: string[] = [];

    for (const [dayStartIso, dayMessages] of groupedByDay) {
      const summaryText = dayMessages
        .map(message => `[${message.authorName}]: ${message.content}`)
        .join('\n');

      const agentMessages = dayMessages.filter(message => message.isAgentMessage === true);
      const keyPoints = agentMessages
        .map(message => getFirstSentence(message.content || ''))
        .filter(Boolean);
      const agentsInvolved = Array.from(
        new Set(
          agentMessages
            .map(message => message.authorId)
            .filter((agentId): agentId is string => Boolean(agentId))
        )
      );

      const embedding = await embedWithOllama(summaryText);

      await dailySummaryCRUD.upsertForDate(channelId, new Date(dayStartIso), {
        channelId,
        date: new Date(dayStartIso),
        summary: summaryText,
        keyPoints,
        messageCount: dayMessages.length,
        agentsInvolved,
        embedding
      });

      storeChannelMemory({
        channelId,
        sessionDate: dayStartIso,
        summary: summaryText.slice(0, 1000),
        keyDecisions: keyPoints,
        agentsInvolved,
      }).catch(err => console.warn('RAG channel memory store failed:', err.message));

      summarizedCount += dayMessages.length;
      for (const message of dayMessages) {
        if (message._id) {
          deletedIds.push(String(message._id));
        }
      }
    }

    if (deletedIds.length > 0) {
      await messageModalCRUD.deleteManyByIds(deletedIds);
      const remainingCount = await messageModalCRUD.countByChannel(channelId);
      const latestMessage = await messageModalCRUD.findByChannel(channelId, 1, 0);
      const lastMessageAt = latestMessage[0]?.timestamp
        ? new Date(latestMessage[0].timestamp)
        : undefined;
      await channelModalCRUD.syncMessageStats(channelId, remainingCount, lastMessageAt);
    }

    return summarizedCount;
  },

  async getDaysSummaries(channelId: string, days = 7) {
    return dailySummaryCRUD.findByChannel(channelId, days);
  },

  async getChannelContext(channelId: string) {
    const recentMessages = await messageModalCRUD.findByChannel(channelId, 50, 0);
    const summaries = await this.getDaysSummaries(channelId, 7);

    return { recentMessages, summaries };
  }
};
