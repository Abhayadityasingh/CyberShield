import { rules } from './rules.js';
import { Threat } from '../../models/Threat.js';
import { logger } from '../../utils/logger.js';

export const SEVERITY_RANK = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
const COOLDOWN_MS = 15 * 60 * 1000;

// Runs every rule against one LoginEvent and returns the Threat documents created.
export async function runDetection(event) {
  const ts = event.timestamp;
  const created = [];

  for (const rule of rules) {
    let finding;
    try {
      finding = await rule(event);
    } catch (err) {
      logger.error(`Detection rule failed: ${err.message}`); // one bad rule must not stop the others
      continue;
    }
    if (!finding) continue;

    // Skip if the same kind of threat is already open, unless this one is more severe.
    const existing = await Threat.findOne({
      dedupKey: finding.dedupKey,
      status: { $in: ['open', 'investigating'] },
      detectedAt: { $gte: new Date(ts.getTime() - COOLDOWN_MS), $lte: ts },
    }).sort({ detectedAt: -1 }).lean();
    if (existing && SEVERITY_RANK[existing.severity] >= SEVERITY_RANK[finding.severity]) continue;

       const threat = await Threat.create({
         detectionMethod: 'rule',
         email: event.email,
         user: event.user ?? null,
         ip: event.ip,
         source: event.source,
         relatedEvents: [event._id],
         detectedAt: ts,
         ...finding,
       });
   logger.warn(`Threat detected [${threat.severity}] ${threat.title} (${threat.email || threat.ip})`);
    created.push(threat);
  }
  return created;
}