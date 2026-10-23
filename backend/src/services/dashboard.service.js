import mongoose from 'mongoose';
import { LoginEvent } from '../models/LoginEvent.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { Threat } from '../models/Threat.js';
import { rules } from './detection/rules.js';
import { connectedClients } from '../sockets/index.js';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
// Points per UNRESOLVED threat. The score is capped at 100.
const RISK_WEIGHT = { low: 3, medium: 8, high: 18, critical: 35 };

export const riskLevel = (score) =>
  score >= 75 ? 'critical' : score >= 50 ? 'elevated' : score >= 25 ? 'guarded' : 'low';

// Chart buckets aligned to the user's local hour/day boundaries
function bucketPlan(range, tzOffsetMin) {
  const nowMs = Date.now();
  const shift = tzOffsetMin * MIN;
  const size = range === '7d' ? DAY : HOUR;
  const count = range === '7d' ? 7 : 24;
  const alignedNow = Math.floor((nowMs + shift) / size) * size - shift;
  return { start: new Date(alignedNow - (count - 1) * size), size, count, now: new Date(nowMs) };
}

const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
const total = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

export async function buildSummary({ range, source, tzOffset }) {
  const { start, size, count, now } = bucketPlan(range, tzOffset);
  const srcFilter = source === 'all' ? {} : { source };
  const inWindow = (field) => ({ ...srcFilter, [field]: { $gte: start, $lte: now } });
  const bucketIndex = (field) => ({ $floor: { $divide: [{ $subtract: [`$${field}`, start] }, size] } });

  const [
    totalEvents, eventsBySource, loginAgg, severityAgg, activeAgg, threatBuckets, loginBuckets, recent,
  ] = await Promise.all([
    SecurityEvent.countDocuments(inWindow('timestamp')),
    // Not filtered by source on purpose: tells the UI whether simulated data exists in this window
    SecurityEvent.aggregate([
      { $match: { timestamp: { $gte: start, $lte: now } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]),
    LoginEvent.aggregate([{ $match: inWindow('timestamp') }, { $group: { _id: '$success', count: { $sum: 1 } } }]),
    Threat.aggregate([{ $match: inWindow('detectedAt') }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Threat.aggregate([
      { $match: { ...srcFilter, status: { $in: ['open', 'investigating'] } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
    Threat.aggregate([{ $match: inWindow('detectedAt') }, { $group: { _id: bucketIndex('detectedAt'), count: { $sum: 1 } } }]),
    LoginEvent.aggregate([
      { $match: inWindow('timestamp') },
      { $group: { _id: { i: bucketIndex('timestamp'), ok: '$success' }, count: { $sum: 1 } } },
    ]),
    Threat.find(inWindow('detectedAt')).sort({ detectedAt: -1 }).limit(6)
      .select('category severity title email ip source status riskScore detectedAt').lean(),
  ]);

  const loginMap = toMap(loginAgg);
  const severityMap = toMap(severityAgg);
  const activeMap = toMap(activeAgg);

  const threatByBucket = toMap(threatBuckets);
  const okByBucket = {};
  const failByBucket = {};
  for (const row of loginBuckets) (row._id.ok ? okByBucket : failByBucket)[row._id.i] = row.count;

  const series = Array.from({ length: count }, (_, i) => ({
    t: new Date(start.getTime() + i * size).toISOString(),
    threats: threatByBucket[i] || 0,
    success: okByBucket[i] || 0,
    failed: failByBucket[i] || 0,
  }));

  const score = Math.min(100, SEVERITIES.reduce((sum, s) => sum + RISK_WEIGHT[s] * (activeMap[s] || 0), 0));
  const bySource = toMap(eventsBySource);

  return {
    range,
    source,
    generatedAt: now.toISOString(),
    window: { from: start.toISOString(), to: now.toISOString() },
    counts: {
      totalEvents,
      threats: total(severityMap),
      activeAlerts: total(activeMap),
      successfulLogins: loginMap.true || 0,
      failedLogins: loginMap.false || 0,
      bySource: { application: bySource.application || 0, simulated: bySource.simulated || 0 },
    },
    risk: {
      score,
      level: riskLevel(score),
      activeBySeverity: Object.fromEntries(SEVERITIES.map((s) => [s, activeMap[s] || 0])),
      weights: RISK_WEIGHT,
    },
    severity: SEVERITIES.map((s) => ({ severity: s, count: severityMap[s] || 0 })),
    series,
    recentThreats: recent,
    system: {
      api: 'operational',
      database: mongoose.connection.readyState === 1 ? 'operational' : 'degraded',
      detectionEngine: { status: 'operational', rules: rules.length },
      realtime: { status: 'operational', clients: connectedClients() },
      mlService: { status: 'not_configured' }, // arrives in Phase 6
    },
  };
}