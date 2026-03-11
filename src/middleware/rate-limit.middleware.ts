import rateLimit from 'express-rate-limit';

// General API rate limit — applied to all routes
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

// Agent discussion rate limit — expensive Ollama calls
export const agentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'Agent rate limit reached. Ollama can only handle a few requests per minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Message send rate limit
export const messageLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  message: { error: 'Sending messages too fast' },
  standardHeaders: true,
  legacyHeaders: false
});

// Vector search rate limit
export const vectorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Vector search rate limit reached' },
  standardHeaders: true,
  legacyHeaders: false
});
