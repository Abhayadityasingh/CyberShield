// Synthetic scenarios for the SIMULATION LAB. They create database records only.
// No network traffic is ever sent anywhere.
const DAY = 24 * 60 * 60 * 1000;
const rand = (n) => Math.floor(Math.random() * n);
// Reserved documentation IP ranges (RFC 5737): never real hosts
const attackerIp = () => `${['203.0.113', '198.51.100', '192.0.2'][rand(3)]}.${1 + rand(254)}`;
const emailFor = (name, id) => `${name}-${id}@sim.cybershield.test`;
const step = (delayMs, event) => ({ delayMs, event });
const delayFirst = (steps, ms) => steps.map((s, i) => (i === 0 ? { ...s, delayMs: ms } : s));

export const SCENARIOS = {
  brute_force: {
    title: 'Repeated failed logins',
    description: 'Many wrong-password attempts against one synthetic account. Optionally ends with a success.',
    params: ['count (1-15, default 6)', 'name', 'thenSuccess (true/false)'],
    plan: ({ count = 6, name = 'victim', thenSuccess = false, id }) => {
      const email = emailFor(name, id);
      const ip = attackerIp();
      const steps = Array.from({ length: count }, () =>
        step(700, { email, success: false, reason: 'bad_password', ip }));
      if (thenSuccess) steps.push(step(900, { email, success: true, ip }));
      return steps;
    },
  },

  credential_stuffing: {
    title: 'One source, many accounts',
    description: 'A single synthetic IP fails against several different synthetic accounts.',
    params: ['count (1-15, default 6)'],
    plan: ({ count = 6, id }) => {
      const ip = attackerIp();
      return Array.from({ length: count }, (_, i) =>
        step(600, { email: emailFor(`target${i + 1}`, id), success: false, reason: 'bad_password', ip }));
    },
  },

  impossible_travel: {
    title: 'Impossible travel',
    description: 'Successful logins from two distant countries within minutes.',
    params: ['name'],
    plan: ({ name = 'traveler', id }) => {
      const email = emailFor(name, id);
      return [
        step(0, { email, success: true, ip: attackerIp(), location: { country: 'IN', city: 'Mumbai' } }),
        step(1500, { email, success: true, ip: attackerIp(), location: { country: 'BR', city: 'Sao Paulo' } }),
      ];
    },
  },

  rapid_logins: {
    title: 'Rapid successful logins',
    description: 'Many successful logins in a very short time (automation-like behaviour).',
    params: ['count (1-15, default 7)', 'name'],
    plan: ({ count = 7, name = 'busyuser', id }) => {
      const email = emailFor(name, id);
      const ip = attackerIp();
      return Array.from({ length: count }, () => step(400, { email, success: true, ip }));
    },
  },

  unusual_time: {
    title: 'Unusual login hour',
    description: 'Builds 12 days of normal daytime history (backdated), then one login at 03:00 UTC.',
    params: ['name'],
    plan: ({ name = 'nightowl', id }) => {
      const email = emailFor(name, id);
      const ip = attackerIp();
      const location = { country: 'IN', city: 'Mumbai' };
      const steps = [];
      for (let d = 13; d >= 2; d--) {
        const t = new Date(Date.now() - d * DAY);
        t.setUTCHours(9 + (d % 3), 0, 0, 0);
        steps.push(step(0, { email, success: true, ip, location, timestamp: t }));
      }
      const odd = new Date();
      odd.setUTCHours(3, 0, 0, 0);
      if (odd.getTime() > Date.now()) odd.setUTCDate(odd.getUTCDate() - 1);
      steps.push(step(0, { email, success: true, ip, location, timestamp: odd }));
      return steps;
    },
  },

  full_demo: {
    title: 'Full attack chain demo',
    description: 'Runs brute force with takeover, credential stuffing and impossible travel in sequence.',
    params: [],
    plan: ({ id }) => [
      ...SCENARIOS.brute_force.plan({ count: 6, name: 'demovictim', thenSuccess: true, id }),
      ...delayFirst(SCENARIOS.credential_stuffing.plan({ count: 6, id }), 1500),
      ...delayFirst(SCENARIOS.impossible_travel.plan({ name: 'demotraveler', id }), 1500),
    ],
  },
};