import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../lib/constants.js';
import Drawer from '../ui/Drawer.jsx';
import Button from '../ui/Button.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { Pill, SeverityBadge, SourceBadge } from '../ui/Badge.jsx';

const riskColor = (s) => (s >= 75 ? 'bg-red-400' : s >= 50 ? 'bg-orange-400' : s >= 25 ? 'bg-amber-400' : 'bg-emerald-400');

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-all text-sm text-slate-200">{children}</dd>
    </div>
  );
}

export default function ThreatDrawer({ id, onClose, onChanged }) {
  const { user } = useAuth();
  const [threat, setThreat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const canEdit = user?.role !== 'viewer';

  useEffect(() => {
    if (!id) { setThreat(null); return undefined; }
    let alive = true;
    setLoading(true);
    setError('');
    api.get(`/threats/${id}`)
      .then((r) => alive && setThreat(r.data.threat))
      .catch((e) => alive && setError(errorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  const setStatus = async (status) => {
    setSaving(status);
    try {
      const r = await api.patch(`/threats/${id}/status`, { status });
      setThreat((t) => ({ ...t, status: r.data.threat.status }));
      toast.success(`Marked as ${STATUS_LABELS[status].toLowerCase()}`);
      onChanged?.();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving('');
    }
  };

  return (
    <Drawer open={!!id} onClose={onClose} title="Threat details">
      {loading && <div className="space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {threat && !loading && (
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={threat.severity} />
              <Pill className="bg-white/5 text-slate-300 ring-white/10">{STATUS_LABELS[threat.status]}</Pill>
              <SourceBadge source={threat.source} />
            </div>
            <h3 className="text-lg font-semibold text-white">{threat.title}</h3>
          </div>

          <section>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Why it was flagged</h4>
            <p className="rounded-xl bg-white/[.04] p-3 text-sm leading-relaxed text-slate-200">{threat.explanation}</p>
            <p className="mt-2 text-xs text-slate-500">This is a heuristic signal and may be a false positive. Review before acting.</p>
          </section>

          <section>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-500">Estimated risk</span>
              <span className="font-mono text-slate-200">{threat.riskScore}/100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${riskColor(threat.riskScore)}`} style={{ width: `${threat.riskScore}%` }} />
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-4">
            <Field label="Category">{CATEGORY_LABELS[threat.category]}</Field>
            <Field label="Detection method"><span className="uppercase">{threat.detectionMethod}</span>{threat.ruleId ? ` · ${threat.ruleId}` : ''}</Field>
            <Field label="Account">{threat.email || '—'}</Field>
            <Field label="Source IP"><span className="font-mono">{threat.ip || '—'}</span></Field>
            <Field label="Detected">{new Date(threat.detectedAt).toLocaleString()}</Field>
          </dl>

          {threat.evidence && Object.keys(threat.evidence).length > 0 && (
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence</h4>
              <dl className="divide-y divide-white/5 rounded-xl bg-white/[.04]">
                {Object.entries(threat.evidence).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-3 py-2 text-sm">
                    <dt className="font-mono text-xs text-slate-400">{k}</dt>
                    <dd className="break-all text-right font-mono text-xs text-slate-200">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {threat.relatedEvents?.length > 0 && (
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Triggering event</h4>
              <ul className="space-y-1.5">
                {threat.relatedEvents.map((ev) => (
                  <li key={ev._id} className="rounded-xl bg-white/[.04] px-3 py-2 text-xs text-slate-300">
                    <span className={ev.success ? 'text-emerald-300' : 'text-red-300'}>{ev.success ? 'Success' : `Failed (${ev.reason})`}</span>
                    {' · '}<span className="font-mono">{ev.ip}</span>
                    {ev.location?.country && ` · ${ev.location.city ? `${ev.location.city}, ` : ''}${ev.location.country}`}
                    {' · '}{new Date(ev.timestamp).toLocaleString()}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Update status</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <Button key={value} size="sm" variant={threat.status === value ? 'primary' : 'outline'}
                  disabled={!canEdit || threat.status === value} loading={saving === value} onClick={() => setStatus(value)}>
                  {label}
                </Button>
              ))}
            </div>
            {!canEdit && <p className="mt-2 text-xs text-slate-500">Your role is view-only.</p>}
          </section>
        </div>
      )}
    </Drawer>
  );
}