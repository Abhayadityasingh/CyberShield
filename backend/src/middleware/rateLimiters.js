import rateLimit from 'express-rate-limit';

const tooMany = (message) => ({ message, status: 429 });

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany('Too many requests, please slow down.'),
});

// Much stricter for login/register to slow down password guessing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany('Too many authentication attempts. Try again later.'),
});