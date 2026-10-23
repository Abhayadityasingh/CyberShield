import { z } from 'zod';

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
const source = z.enum(['application', 'simulated']);
const text = z.string().trim().max(100);

export const eventsQuerySchema = z.object({
  page, limit,
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
  type: z.enum(['login_success', 'login_failed', 'threat_detected']).optional(),
  source: source.optional(),
  q: text.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const threatsQuerySchema = z.object({
  page, limit,
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.enum(['brute_force', 'credential_stuffing', 'suspicious_frequency',
    'unusual_login_time', 'location_anomaly', 'account_compromise', 'ml_anomaly']).optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'false_positive']).optional(),
  source: source.optional(),
  q: text.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const threatStatusSchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'false_positive']),
});
export const runSimulationSchema = z.object({
  scenario: z.enum(['brute_force', 'credential_stuffing', 'impossible_travel',
    'rapid_logins', 'unusual_time', 'full_demo']),
  count: z.coerce.number().int().min(1).max(15).optional(),
  name: z.string().trim().toLowerCase().regex(/^[a-z0-9]{1,20}$/, 'Letters and numbers only (max 20)').optional(),
  thenSuccess: z.boolean().optional(),
});

export const dashboardQuerySchema = z.object({
  range: z.enum(['24h', '7d']).default('24h'),
  source: z.enum(['all', 'application', 'simulated']).default('all'),
  tzOffset: z.coerce.number().int().min(-840).max(840).default(0), // browser offset in minutes
});