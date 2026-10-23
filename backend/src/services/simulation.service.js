import { randomUUID } from 'node:crypto';
import { SCENARIOS } from '../simulation/scenarios.js';
import { recordLoginEvent } from './eventIngestion.service.js';
import { LoginEvent } from '../models/LoginEvent.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { Threat } from '../models/Threat.js';
import { Notification } from '../models/Notification.js';
import { bus } from '../events/bus.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let active = null; // only one simulation at a time

export const getStatus = () => (active ? { running: true, ...active } : { running: false });

export const describeScenarios = () =>
  Object.entries(SCENARIOS).map(([id, s]) => ({ id, title: s.title, description: s.description, params: s.params }));

export async function startScenario({ scenario, params = {} }) {
  if (active) throw new AppError('A simulation is already running', 409);
  const def = SCENARIOS[scenario];
  if (!def) throw new AppError('Unknown scenario', 400);

  const runId = randomUUID();
  const steps = def.plan({ ...params, id: runId.slice(0, 6) });
  active = { runId, scenario, planned: steps.length, done: 0, startedAt: new Date() };
  bus.emit('simulation', { status: 'started', runId, scenario, planned: steps.length });

  // Play the steps in the background so the HTTP request returns immediately
  (async () => {
    let threats = 0;
    try {
      for (const s of steps) {
        if (s.delayMs) await sleep(s.delayMs);
        const result = await recordLoginEvent({
          source: 'simulated',
          ...s.event,
          timestamp: s.event.timestamp ?? new Date(),
        });
        threats += result.threats.length;
        active.done += 1;
        bus.emit('simulation', { status: 'progress', runId, done: active.done, planned: steps.length });
      }
      bus.emit('simulation', { status: 'finished', runId, scenario, events: steps.length, threats });
      logger.info(`Simulation finished: ${scenario} (${steps.length} events, ${threats} threats)`);
    } catch (err) {
      logger.error(`Simulation failed: ${err.message}`);
      bus.emit('simulation', { status: 'failed', runId, message: 'Simulation failed' });
    } finally {
      active = null;
    }
  })();

  return { runId, scenario, plannedEvents: steps.length };
}

export async function clearSimulatedData() {
  const threatIds = await Threat.distinct('_id', { source: 'simulated' });
  const [notifications, threats, events, logins] = await Promise.all([
    Notification.deleteMany({ threat: { $in: threatIds } }),
    Threat.deleteMany({ source: 'simulated' }),
    SecurityEvent.deleteMany({ source: 'simulated' }),
    LoginEvent.deleteMany({ source: 'simulated' }),
  ]);
  return {
    notifications: notifications.deletedCount,
    threats: threats.deletedCount,
    securityEvents: events.deletedCount,
    loginEvents: logins.deletedCount,
  };
}