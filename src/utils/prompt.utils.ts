import { COMPANY_PROFILE } from '../mastra/company/company.config.js';
import type { CompanyState } from '../modals/company-state.modal.js';

export function buildAgentPrompt(
  instructions: string,
  scenario: { title: string; description: string },
  companyState: CompanyState,
  context?: string
): string {
  return `${instructions}

## Your Company
${COMPANY_PROFILE.whatWeDo}
Stage: ${COMPANY_PROFILE.stage} | Raised: ${COMPANY_PROFILE.raised}
Customers: ${COMPANY_PROFILE.customers}
Competitors: ${COMPANY_PROFILE.competitors.join(', ')}
Edge: ${COMPANY_PROFILE.differentiator}

## Current State (Month ${companyState.month}, ${companyState.year})
ARR: $${(companyState.arr / 1000000).toFixed(1)}M | Burn: $${companyState.burnRate.toLocaleString()}/mo
Runway: ${companyState.runway} months | Headcount: ${companyState.headcount}
Open Issues: ${companyState.openIssues.length > 0 ? companyState.openIssues.join(', ') : 'None'}

## Scenario
${scenario.title}: ${scenario.description}

${context ? `## Recent Discussion\n${context}\n` : ''}Respond in character. Be specific to SimCo's situation.`;
}
