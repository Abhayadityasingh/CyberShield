import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { safeRecordLoginEvent } from '../services/eventIngestion.service.js';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

// A throwaway hash so "unknown email" takes the same time as "wrong password".
// This prevents attackers from discovering which emails exist by measuring response time.
const DUMMY_HASH = await User.hashPassword('dummy-password-for-timing');

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new AppError('Email is already registered', 409);

  const user = await User.create({ name, email, passwordHash: await User.hashPassword(password) });
  logger.info(`User registered: ${user.email}`);
  res.status(201).json({ success: true, token: signToken(user), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    await User.prototype.verifyPassword.call({ passwordHash: DUMMY_HASH }, password);
    throw new AppError('Invalid email or password', 401);
  }
  if (user.isLocked) {
    throw new AppError('Account temporarily locked due to repeated failed logins. Try again later.', 423);
  }

  const ok = await user.verifyPassword(password);
  if (!ok) {
    const count = user.failedLoginCount + 1;
    const update = { failedLoginCount: count };
    if (count >= MAX_FAILED) {
      update.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      update.failedLoginCount = 0;
      logger.warn(`Account locked after repeated failures: ${user.email}`);
    }
    await User.updateOne({ _id: user._id }, update);
    throw new AppError('Invalid email or password', 401);
  }

  await User.updateOne({ _id: user._id }, { failedLoginCount: 0, lockUntil: null, lastLoginAt: new Date() });
  user.lastLoginAt = new Date();
  res.json({ success: true, token: signToken(user), user });
});

export const me = (req, res) => res.json({ success: true, user: req.user });

// JWTs are stateless: the client discards the token. This endpoint exists so the
// client has one place to call, and so Phase 2 can record a logout event.
export const logout = (_req, res) => res.json({ success: true, message: 'Logged out' });