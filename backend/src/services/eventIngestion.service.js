import { LoginEvent } from '../models/LoginEvent.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { runDetection, SEVERITY_RANK } from './detection/engine.js';
import { runMLDetection } from './ml/mlDetection.js';
import { normalizeIp } from '../utils/ip.js';
import { bus } from '../events/bus.js';
import { logger } from '../utils/logger.js';

const REASON_LABEL = {
  bad_password: 'wrong password',
  unknown_user: 'unknown account',
  account_locked: 'account locked',
};

async function handleThreat(threat) {
  const feedItem = await SecurityEvent.create({
    type: 'threat_detected',
    severity: threat.severity,
    message: `${threat.title} (${threat.email || threat.ip})`,
    email: threat.email,
    ip: threat.ip,
    source: threat.source,
    threat: threat._id,
    timestamp: threat.detectedAt,
  });
  bus.emit('security-event', feedItem.toObject());
  bus.emit('threat', threat.toObject());

  // Notify analysts/admins about medium and above
  if (SEVERITY_RANK[threat.severity] >= SEVERITY_RANK.medium) {
    const recipients = await User.find({ role: { $in: ['admin', 'analyst'] } }).select('_id').lean();
    if (recipients.length) {
      const docs = await Notification.insertMany(
        recipients.map((u) => ({
          user: u._id,
          title: threat.title,
          message: threat.explanation,
          severity: threat.severity,
          threat: threat._id,
        }))
      );
      bus.emit('notifications', docs.map((d) => d.toObject()));
    }
  }
}

export async function recordLoginEvent({
  user = null, email, success, reason = 'ok', ip, userAgent = '',
  location, source = 'application', timestamp = new Date(),
}) {
  const event = await LoginEvent.create({
    user: user?._id ?? user ?? null,
    email,
    success,
    reason: success ? 'ok' : reason,
    ip: normalizeIp(ip),
    userAgent,
    location,
    source,
    timestamp,
  });

  const feedItem = await SecurityEvent.create({
    type: success ? 'login_success' : 'login_failed',
    severity: success ? 'info' : 'low',
    message: success
      ? `Successful login for ${email}`
      : `Failed login for ${email} (${REASON_LABEL[reason] || 'failed'})`,
    email,
    ip: event.ip,
    source,
    loginEvent: event._id,
    timestamp,
  });
  bus.emit('security-event', feedItem.toObject());

 const threats = await runDetection(event);
for (const threat of threats) await handleThreat(threat);

// Run ML independently after the existing six detection rules.
const mlThreat = await runMLDetection(event);

if (mlThreat) {
  threats.push(mlThreat);
  await handleThreat(mlThreat);
}

return { event, threats };
}

// Used by the login controller: monitoring must never break the login itself.
export async function safeRecordLoginEvent(data) {
  try {
    return await recordLoginEvent(data);
  } catch (err) {
    logger.error(`Failed to record login event: ${err.message}`);
    return null;
  }
}