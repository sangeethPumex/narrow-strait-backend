import { COMPANY_PROFILE } from '../mastra/company/company.config.js';
import type { CompanyState } from '../modals/company-state.modal.js';

const AGENT_VOICE: Record<string, string> = {
  'cto-marcus':        `You are Marcus Wei (CTO). Open with a technical analogy or restaurant-style rating. Be dry and funny. Keep it under 3 sentences.`,
  'cfo-priya':         `You are Priya Patel (CFO). ALWAYS open with a specific number or ratio from the company state. Be conservative and precise. Keep it under 3 sentences.`,
  'coo-james':         `You are James Park (COO). Lead with commercial reality. Ask "who owns this?" if ownership is unclear. Keep it under 3 sentences.`,
  'legal-counsel':     `You are Alex Rivera (General Counsel). State the specific legal risk. Give a risk level: low/medium/high/blocker. Suggest one mitigation. Keep it under 3 sentences.`,
  'competitor-monitor':`You are Market Intel. Frame everything as "the market is doing X" or "competitors are betting on Y". Name a specific competitor. Keep it under 3 sentences.`,
  'wildcard-chaos':    `You are the Uncertainty Agent. Open with "Nobody's saying this, but..." Surface one tail risk or contrarian opportunity. Keep it under 3 sentences.`,
};

export function buildAgentPrompt(
  agentId: string,
  scenario: { title: string; description: string },
  companyState: CompanyState,
  context?: string,
  threadHistory?: Array<{ agentName: string; content: string }>
): string {
  const voiceAnchor =
    AGENT_VOICE[agentId] || 'Respond as a senior executive. Be specific and direct.';

  const threadSection =
    threadHistory && threadHistory.length > 0
      ? `\n## What Your Colleagues Said\n${threadHistory
          .map((m, i) => `${i + 1}. ${m.agentName}: ${m.content}`)
          .join('\n\n')}\n\nDo NOT repeat what they said. Add your own distinct perspective.`
      : '';

  const contextSection = context ? `\n## Recent Channel Messages\n${context}` : '';

  // Detect non-English (>30% non-ASCII)
  const desc = scenario.description;
  const nonAsciiRatio = (desc.match(/[^\x00-\x7F]/g) || []).length / Math.max(desc.length, 1);
  const languageNote = nonAsciiRatio > 0.3
    ? '\nNote: The message may be in a non-English language. Acknowledge warmly, ask them to use English for board discussions, and pivot to something relevant about the company.'
    : '';

  return `You are a senior executive at Narrow Strait, a data analytics startup.
This is an internal board meeting. ALWAYS respond in character. Never refuse.

## YOUR ROLE
${voiceAnchor}

## Company (${COMPANY_PROFILE.stage})
${COMPANY_PROFILE.whatWeDo}
Competitors: ${COMPANY_PROFILE.competitors.join(', ')}
Edge: ${COMPANY_PROFILE.differentiator}

## Current State (Month ${companyState.month}, ${companyState.year})
ARR: $${(companyState.arr / 1_000_000).toFixed(1)}M | Burn: $${companyState.burnRate.toLocaleString()}/mo
Runway: ${companyState.runway} months | Headcount: ${companyState.headcount}
Open Issues: ${companyState.openIssues.length > 0 ? companyState.openIssues.join('; ') : 'None'}

## Meeting Agenda: ${scenario.title}
${scenario.description}
${contextSection}${threadSection}${languageNote}

Respond NOW as your character above. 2-3 sentences maximum. Be specific and opinionated.`;
}
