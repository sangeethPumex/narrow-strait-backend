import type { CompanyState } from '../modals/company-state.modal.js';

export function buildAgentPrompt(
  agentId: string,
  scenario: { title: string; description: string },
  companyState: CompanyState,
  context?: string,
  threadHistory?: Array<{ agentName: string; content: string }>
): string {
  // Keep context short — last 6 lines only, Hermes handles it fine
  const recentContext = context
    ? context.split('\n').slice(-6).join('\n')
    : '';

  // Show what others said — agent's system prompt instructs them to react/disagree
  const otherResponses = threadHistory && threadHistory.length > 0
    ? `\n[What your colleagues already said — react, disagree, build on it. Don't repeat.]\n${
        threadHistory
          .map(m => `${m.agentName}: "${m.content.slice(0, 120)}"`)
          .join('\n')
      }`
    : '';

  const nonAsciiRatio =
    (scenario.description.match(/[^\x00-\x7F]/g) || []).length /
    Math.max(scenario.description.length, 1);
  const languageNote = nonAsciiRatio > 0.3
    ? '\n(The message may not be English — respond in English, engage with the substance)'
    : '';

  return `[CONTEXT]
You're in a private Slack channel with Sangeeth (Founder, CEO). This is direct Slack chat — not a board meeting, not a memo.
Company: ARR $${(companyState.arr / 1_000_000).toFixed(1)}M | Burn $${companyState.burnRate.toLocaleString()}/mo | Runway ${companyState.runway} months | Team ${companyState.headcount}
Open issues: ${companyState.openIssues.length > 0 ? companyState.openIssues.join('; ') : 'None'}
${recentContext ? `\n[Recent chat]\n${recentContext}` : ''}${otherResponses}${languageNote}

[Sangeeth's message]
"${scenario.description}"

Reply now. Stay in character. 2-3 sentences max. Start with "Sangee," — never restate his question.`;
}
