import { LoginEvent } from '../../models/LoginEvent.js';

const MIN = 60 * 1000;
const ago = (ts, ms) => new Date(ts.getTime() - ms);

/*
 Each rule receives the LoginEvent that was just saved and returns either:
   null                  -> nothing suspicious
   { ruleId, category, severity, riskScore, title, explanation, evidence, dedupKey }
 All time windows are measured relative to the event's own timestamp.
*/

// 1. Many failed logins for one account in a short time
async function repeatedFailedLogins(event) {
  if (event.success) return null;
  const ts = event.timestamp;
  const count = await LoginEvent.countDocuments({
    email: event.email, success: false, timestamp: { $gte: ago(ts, 10 * MIN), $lte: ts },
  });
  if (count < 5) return null;
  const critical = count >= 10;
  return {
    ruleId: 'RULE_FAILED_LOGINS',
    category: 'brute_force',
    severity: critical ? 'critical' : 'high',
    riskScore: critical ? 90 : 70,
    title: 'Repeated failed login attempts',
    explanation: `${count} failed logins for ${event.email} in the last 10 minutes (threshold: 5). This pattern may indicate password guessing.`,
    evidence: { count, windowMinutes: 10, threshold: 5 },
    dedupKey: `failed:${event.email}`,
  };
}
// 2. One IP failing against many different accounts
async function credentialStuffing(event) {
  if (event.success) return null;
  const ts = event.timestamp;
  const emails = await LoginEvent.distinct('email', {
    ip: event.ip, success: false, timestamp: { $gte: ago(ts, 10 * MIN), $lte: ts },
  });
  if (emails.length < 5) return null;
  return {
    ruleId: 'RULE_IP_MANY_ACCOUNTS',
    email: null,
    category: 'credential_stuffing',
    severity: 'high',
    riskScore: 75,
    title: 'One IP failing against many accounts',
    explanation: `IP ${event.ip} had failed logins against ${emails.length} different accounts in 10 minutes (threshold: 5). This may indicate credential stuffing.`,
    evidence: { distinctAccounts: emails.length, windowMinutes: 10, threshold: 5 },
    dedupKey: `stuffing:${event.ip}`,
  };
}
// 3. Unusually many successful logins in a short time (session abuse, automation)
async function suspiciousFrequency(event) {
  if (!event.success) return null;
  const ts = event.timestamp;
  const count = await LoginEvent.countDocuments({
    email: event.email, success: true, timestamp: { $gte: ago(ts, 5 * MIN), $lte: ts },
  });
  if (count < 6) return null;
  return {
    ruleId: 'RULE_LOGIN_FREQUENCY',
    category: 'suspicious_frequency',
    severity: 'medium',
    riskScore: 50,
    title: 'Unusually frequent logins',
    explanation: `${count} successful logins for ${event.email} within 5 minutes (threshold: 6). This may indicate automation or session abuse.`,
    evidence: { count, windowMinutes: 5, threshold: 6 },
    dedupKey: `frequency:${event.email}`,
  };
}

// 4. Login at an hour this account has never used (needs 10+ previous successes)
async function unusualLoginTime(event) {
  if (!event.success) return null;
  const ts = event.timestamp;
  const history = await LoginEvent.find({ email: event.email, success: true, timestamp: { $lt: ts } })
    .sort({ timestamp: -1 }).limit(200).select('timestamp').lean();
  if (history.length < 10) return null;

  const hour = ts.getUTCHours();
  const circularDistance = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 24 - d); };
  const minDist = Math.min(...history.map((h) => circularDistance(hour, h.timestamp.getUTCHours())));
  if (minDist < 3) return null;

  return {
    ruleId: 'RULE_UNUSUAL_TIME',
    category: 'unusual_login_time',
    severity: 'medium',
    riskScore: 55,
    title: 'Login at an unusual time',
    explanation: `Login at ${String(hour).padStart(2, '0')}:00 UTC is ${minDist} hours away from the nearest hour this account normally logs in (based on ${history.length} earlier logins). Could be a legitimate schedule change.`,
    evidence: { loginHourUtc: hour, nearestUsualHourDistance: minDist, historySize: history.length },
    dedupKey: `time:${event.email}`,
  };
}

// 5. Country changed too quickly, or a never-before-seen country
async function locationChange(event) {
  const country = event.location?.country;
  if (!event.success || !country) return null;
  const ts = event.timestamp;

  const prev = await LoginEvent.findOne({
    email: event.email, success: true, timestamp: { $lt: ts },
    'location.country': { $exists: true, $ne: null },
  }).sort({ timestamp: -1 }).lean();
  if (!prev || prev.location.country === country) return null;

  const gapMinutes = Math.round((ts - prev.timestamp) / MIN);
  if (gapMinutes <= 60) {
    return {
      ruleId: 'RULE_LOCATION_JUMP',
      category: 'location_anomaly',
      severity: 'high',
      riskScore: 85,
      title: 'Login country changed within an hour',
      explanation: `Login from ${country} only ${gapMinutes} minutes after a login from ${prev.location.country}. Physically impossible travel is a heuristic; a VPN could also explain this.`,
      evidence: { from: prev.location.country, to: country, gapMinutes },
      dedupKey: `location:${event.email}`,
    };
  }

  const known = await LoginEvent.distinct('location.country', {
    email: event.email, success: true, timestamp: { $lt: ts },
  });
  if (known.includes(country)) return null;
  return {
    ruleId: 'RULE_NEW_COUNTRY',
    category: 'location_anomaly',
    severity: 'medium',
    riskScore: 55,
    title: 'Login from a new country',
    explanation: `First login for ${event.email} from ${country}. Previously seen: ${known.join(', ') || 'none'}. Could be legitimate travel.`,
    evidence: { newCountry: country, knownCountries: known },
    dedupKey: `location:${event.email}`,
  };
}
// 6. Success right after many failures: the attacker may have guessed the password
async function possibleCompromise(event) {
  if (!event.success) return null;
  const ts = event.timestamp;
  const failures = await LoginEvent.countDocuments({
    email: event.email, success: false, timestamp: { $gte: ago(ts, 10 * MIN), $lt: ts },
  });
  if (failures < 5) return null;
  return {
    ruleId: 'RULE_SUCCESS_AFTER_FAILURES',
    category: 'account_compromise',
    severity: 'critical',
    riskScore: 95,
    title: 'Successful login after repeated failures',
    explanation: `${event.email} logged in successfully right after ${failures} failed attempts in 10 minutes. If this was not the account owner, the password may be compromised. Review immediately.`,
    evidence: { priorFailures: failures, windowMinutes: 10 },
    dedupKey: `compromise:${event.email}`,
  };
}


export const rules = [
  repeatedFailedLogins, credentialStuffing, suspiciousFrequency,
  unusualLoginTime, locationChange, possibleCompromise,
];