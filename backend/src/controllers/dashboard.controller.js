import { asyncHandler } from '../utils/asyncHandler.js';
import { buildSummary } from '../services/dashboard.service.js';

export const getSummary = asyncHandler(async (req, res) => {
  const data = await buildSummary(req.validatedQuery);
  res.json({ success: true, ...data });
});