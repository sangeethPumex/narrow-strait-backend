import { Request, Response, NextFunction } from 'express';

const MAX_CONTENT_LENGTH = 2000;
const MAX_SCENARIO_LENGTH = 1000;
const VALID_AGENT_IDS = [
  'cto-marcus',
  'cfo-priya',
  'coo-james',
  'legal-counsel',
  'competitor-monitor',
  'wildcard-chaos'
];

// Validate message content before saving
export function validateMessage(req: Request, res: Response, next: NextFunction) {
  const { content, contentType } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content is required and must be a string' });
  }
  if (content.trim().length === 0) {
    return res.status(400).json({ error: 'content cannot be empty' });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({
      error: `content exceeds max length of ${MAX_CONTENT_LENGTH} characters`
    });
  }
  if (contentType && !['text', 'voice', 'system'].includes(contentType)) {
    return res.status(400).json({ error: 'contentType must be text, voice, or system' });
  }

  req.body.content = content.trim();
  return next();
}

// Validate scenario and agentIds before triggering discussion
export function validateDiscussion(req: Request, res: Response, next: NextFunction) {
  const { scenario, agentIds, rounds } = req.body;

  if (!scenario || typeof scenario !== 'object') {
    return res.status(400).json({ error: 'scenario object is required' });
  }
  if (!scenario.title || typeof scenario.title !== 'string' || scenario.title.trim().length === 0) {
    return res.status(400).json({ error: 'scenario.title is required' });
  }
  if (
    !scenario.description ||
    typeof scenario.description !== 'string' ||
    scenario.description.trim().length === 0
  ) {
    return res.status(400).json({ error: 'scenario.description is required' });
  }
  if (scenario.title.length > MAX_SCENARIO_LENGTH) {
    return res.status(400).json({ error: 'scenario.title too long' });
  }
  if (scenario.description.length > MAX_SCENARIO_LENGTH) {
    return res.status(400).json({ error: 'scenario.description too long' });
  }
  if (agentIds !== undefined) {
    if (!Array.isArray(agentIds)) {
      return res.status(400).json({ error: 'agentIds must be an array' });
    }
    if (agentIds.length === 0) {
      return res.status(400).json({ error: 'agentIds cannot be empty array' });
    }
    if (agentIds.length > 6) {
      return res.status(400).json({ error: 'max 6 agents per discussion' });
    }

    const invalidIds = agentIds.filter(
      (id: unknown) => typeof id !== 'string' || !VALID_AGENT_IDS.includes(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: `invalid agentIds: ${invalidIds.join(', ')}`,
        validIds: VALID_AGENT_IDS
      });
    }
  }
  if (rounds !== undefined) {
    if (typeof rounds !== 'number' || rounds < 1 || rounds > 3) {
      return res.status(400).json({ error: 'rounds must be a number between 1 and 3' });
    }
  }

  req.body.scenario.title = scenario.title.trim();
  req.body.scenario.description = scenario.description.trim();
  return next();
}

// Validate vector search query
export function validateVectorSearch(req: Request, res: Response, next: NextFunction) {
  const { query, threshold, limit } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query is required' });
  }
  if (query.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({ error: 'query too long' });
  }
  if (
    threshold !== undefined &&
    (typeof threshold !== 'number' || threshold < 0 || threshold > 1)
  ) {
    return res.status(400).json({ error: 'threshold must be a number between 0 and 1' });
  }
  if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 20)) {
    return res.status(400).json({ error: 'limit must be a number between 1 and 20' });
  }

  req.body.query = query.trim();
  return next();
}
