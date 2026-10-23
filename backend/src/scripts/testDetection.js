import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { recordLoginEvent } from '../services/eventIngestion.service.js';
import { LoginEvent } from '../models/LoginEvent.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { Threat } from '../models/Threat.js';
import { Notification } from '../models/Notification.js';

// All data below is SYNTHETIC. IPs come from ranges reserved for documentation (RFC 5737).
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const now = Date.now();
const minutesAgo = (m) => new Date(now - m * MIN);
const found = [];

async function send(event) {
  const { threats } = await recordLoginEvent({ source: 'simulated', ...event });
  found.push(...threats);
}

await connectDB();

// Make the script re-runnable: remove earlier simulated data first
const oldIds = await Threat.distinct('_id', { source: 'simulated' });
await Notification.deleteMany({ threat: { $in: oldIds } });
await Threat.deleteMany({ source: 'simulated' });
await SecurityEvent.deleteMany({ source: 'simulated' });
await LoginEvent.deleteMany({ source: 'simulated' });

// A + B: 6 failures, then a success from the same IP -> brute force + possible compromise
for (const m of [8, 7, 6, 5, 4, 3]) {
  await send({ email: 'victim1@test.com', success: false, reason: 'bad_password', ip: '203.0.113.10', timestamp: minutesAgo(m) });
}
await send({ email: 'victim1@test.com', success: true, ip: '203.0.113.10', timestamp: minutesAgo(1) });

// C: one IP failing against 6 different accounts -> credential stuffing
for (const [i, m] of [6, 5, 4, 3, 2, 1].entries()) {
  await send({ email: `user${i + 1}@test.com`, success: false, reason: 'bad_password', ip: '198.51.100.7', timestamp: minutesAgo(m) });
}

// D: 12 normal logins (09:00-11:00 UTC), then one at 03:00 UTC -> unusual time
for (let i = 13; i >= 2; i--) {
  const t = new Date(now - i * DAY);
  t.setUTCHours(9 + (i % 3), 0, 0, 0);
  await send({ email: 'alice@test.com', success: true, ip: '192.0.2.20', location: { country: 'IN', city: 'Mumbai' }, timestamp: t });
}
const odd = new Date(now);
odd.setUTCHours(3, 0, 0, 0);
if (odd.getTime() > now) odd.setUTCDate(odd.getUTCDate() - 1);
await send({ email: 'alice@test.com', success: true, ip: '192.0.2.20', location: { country: 'IN', city: 'Mumbai' }, timestamp: odd });

// E: India, then Brazil 30 minutes later -> location anomaly
await send({ email: 'bob@test.com', success: true, ip: '192.0.2.31', location: { country: 'IN', city: 'Delhi' }, timestamp: minutesAgo(30) });
await send({ email: 'bob@test.com', success: true, ip: '198.51.100.44', location: { country: 'BR', city: 'Sao Paulo' }, timestamp: minutesAgo(0) });

// F: 7 successful logins in 3 minutes -> suspicious frequency
for (const m of [4, 3.5, 3, 2.5, 2, 1.5, 1]) {
  await send({ email: 'carol@test.com', success: true, ip: '192.0.2.50', timestamp: minutesAgo(m) });
}
console.log(`\nRule-based threats: ${found.filter(t => t.detectionMethod === 'rule').length} (expected: 6) | ML threats: ${found.filter(t => t.detectionMethod === 'ml').length} | Total: ${found.length}\n`);
for (const t of found) {
  console.log(`${t.severity.toUpperCase().padEnd(9)} ${t.category.padEnd(22)} ${(t.email || t.ip).padEnd(20)} score=${t.riskScore}`);
}
await mongoose.disconnect();