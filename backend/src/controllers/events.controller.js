import { SecurityEvent } from '../models/SecurityEvent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';

export const listEvents = asyncHandler(async (req, res) => {
  const { page, limit, severity, type, source, q, from, to } = req.validatedQuery;
  const filter = {};
  if (severity) filter.severity = severity;
  if (type) filter.type = type;
  if (source) filter.source = source;
  if (from || to) filter.timestamp = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ email: rx }, { ip: rx }, { message: rx }];
  }

  const [items, total] = await Promise.all([
    SecurityEvent.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    SecurityEvent.countDocuments(filter),
  ]);
  res.json({ success: true, items, page, limit, total, pages: Math.ceil(total / limit) });
});