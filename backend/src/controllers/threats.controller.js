import mongoose from 'mongoose';
import { Threat } from '../models/Threat.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const checkId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid id', 400);
};

export const listThreats = asyncHandler(async (req, res) => {
  const { page, limit, severity, category, status, source, q, from, to } = req.validatedQuery;
  const filter = {};
  if (severity) filter.severity = severity;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (from || to) filter.detectedAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ email: rx }, { ip: rx }, { title: rx }];
  }

  const [items, total] = await Promise.all([
    Threat.find(filter).sort({ detectedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Threat.countDocuments(filter),
  ]);
  res.json({ success: true, items, page, limit, total, pages: Math.ceil(total / limit) });
});

export const getThreat = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const threat = await Threat.findById(req.params.id).populate('relatedEvents').lean();
  if (!threat) throw new AppError('Threat not found', 404);
  res.json({ success: true, threat });
});

export const updateThreatStatus = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const threat = await Threat.findByIdAndUpdate(
    req.params.id, { status: req.body.status }, { new: true, runValidators: true }
  );
  if (!threat) throw new AppError('Threat not found', 404);
  res.json({ success: true, threat });
});