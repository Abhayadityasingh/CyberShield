
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Play, Trash2, FlaskConical, Activity } from 'lucide-react';
import { api, errorMessage } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import Button from '../components/ui/Button.jsx';
import GlassCard from '../components/ui/GlassCard.jsx';

export default function SimulationLab() {
  const { socket, connected } = useSocket();

  const [scenarios, setScenarios] = useState([]);
  const [selected, setSelected] = useState('brute_force');
  const [status, setStatus] = useState({ running: false });
  const [count, setCount] = useState(6);
  const [name, setName] = useState('');
  const [thenSuccess, setThenSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const refreshStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/simulation/status');
      setStatus(data);
    } catch (err) {
      console.error('Simulation status:', err);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [scenarioResponse, statusResponse] = await Promise.all([
          api.get('/simulation/scenarios'),
          api.get('/simulation/status'),
        ]);

        if (!active) return;

        setScenarios(scenarioResponse.data.scenarios || []);
        setStatus(statusResponse.data);
      } catch (err) {
        if (active) toast.error(errorMessage(err));
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    function handleSimulation(event) {
      if (event.status === 'started') {
        setStatus({
          running: true,
          runId: event.runId,
          scenario: event.scenario,
          planned: event.planned,
          done: 0,
        });
      }

      if (event.status === 'progress') {
        setStatus((previous) => ({
          ...previous,
          running: true,
          runId: event.runId,
          planned: event.planned,
          done: event.done,
        }));
      }

      if (event.status === 'finished') {
        setLastResult(event);
        toast.success(
          `Simulation finished: ${event.events} events, ${event.threats} threats`
        );
        refreshStatus();
      }

      if (event.status === 'failed') {
        toast.error(event.message || 'Simulation failed');
        refreshStatus();
      }
    }

    socket.on('simulation', handleSimulation);
    refreshStatus();

    return () => socket.off('simulation', handleSimulation);
  }, [socket, refreshStatus]);

  // Also recover the correct status if the socket disconnects or an event is missed.
  useEffect(() => {
    if (!status.running) return undefined;

    const interval = setInterval(refreshStatus, 1500);
    return () => clearInterval(interval);
  }, [status.running, refreshStatus]);

  const current = scenarios.find((item) => item.id === selected);

  const usesCount = ['brute_force', 'credential_stuffing', 'rapid_logins'].includes(selected);
  const usesName = ['brute_force', 'impossible_travel', 'rapid_logins', 'unusual_time'].includes(selected);

  async function runSimulation() {
    if (status.running || loading) return;

    const payload = { scenario: selected };

    if (usesCount) {
      const numericCount = Number(count);

      if (!Number.isInteger(numericCount) || numericCount < 1 || numericCount > 15) {
        toast.error('Count must be between 1 and 15');
        return;
      }

      payload.count = numericCount;
    }

    if (usesName && name.trim()) {
      const cleanName = name.trim().toLowerCase();

      if (!/^[a-z0-9]{1,20}$/.test(cleanName)) {
        toast.error('Name must contain 1–20 letters or numbers only');
        return;
      }

      payload.name = cleanName;
    }

    if (selected === 'brute_force') {
      payload.thenSuccess = thenSuccess;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const { data } = await api.post('/simulation/run', payload);

      setStatus({
        running: true,
        runId: data.runId,
        scenario: data.scenario,
        planned: data.plannedEvents,
        done: 0,
      });

      toast.success('Synthetic simulation started');
      refreshStatus();
    } catch (err) {
      toast.error(errorMessage(err));
      refreshStatus();
    } finally {
      setLoading(false);
    }
  }

  async function clearSimulationData() {
    if (status.running || clearing) return;

    const confirmed = window.confirm(
      'Delete ALL simulated login events, security events, threats and related notifications? This cannot be undone. Real application records will not be selected for deletion.'
    );

    if (!confirmed) return;

    setClearing(true);

    try {
      const { data } = await api.delete('/simulation/data');
      const removed = data.removed || {};

      toast.success(
        `Cleared ${removed.loginEvents || 0} simulated logins and ${removed.threats || 0} simulated threats`
      );

      setLastResult(null);
      refreshStatus();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setClearing(false);
    }
  }

  const planned = status.planned || 0;
  const done = status.done || 0;
  const progress = planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <FlaskConical className="h-7 w-7 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Simulation Lab</h1>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Safely test CyberShield detection using synthetic login events.
        </p>
      </div>

      <GlassCard className="border border-cyan-400/20 p-5">
        <p className="text-sm font-semibold text-cyan-300">
          SIMULATION MODE — TEST DATA ONLY
        </p>
        <p className="mt-2 text-sm text-slate-400">
          These scenarios generate synthetic database records labelled
          {' '}<span className="font-mono text-cyan-300">source=simulated</span>.
          They do not send attack traffic to real systems.
        </p>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Choose a scenario
          </h2>

          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                disabled={status.running || loading}
                onClick={() => setSelected(scenario.id)}
                className={`w-full rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected === scenario.id
                    ? 'border-cyan-400/60 bg-cyan-400/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-100">
                    {scenario.title}
                  </span>
                  <span className={`h-3 w-3 shrink-0 rounded-full border ${
                    selected === scenario.id
                      ? 'border-cyan-400 bg-cyan-400'
                      : 'border-slate-500'
                  }`} />
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {scenario.description}
                </p>
              </button>
            ))}

            {scenarios.length === 0 && (
              <p className="text-sm text-slate-400">
                No scenarios loaded. Check the backend and your account permissions.
              </p>
            )}
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-5">
            <h2 className="text-lg font-semibold text-white">
              Scenario settings
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {current?.description || 'Select a scenario to begin.'}
            </p>

            <div className="mt-5 space-y-4">
              {usesCount && (
                <label className="block text-sm text-slate-300">
                  Number of attempts (1–15)
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={count}
                    disabled={status.running}
                    onChange={(event) => setCount(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-ink-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
              )}

              {usesName && (
                <label className="block text-sm text-slate-300">
                  Synthetic account name (optional)
                  <input
                    type="text"
                    maxLength={20}
                    value={name}
                    disabled={status.running}
                    placeholder="Use scenario default"
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-ink-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Letters and numbers only, maximum 20 characters.
                  </span>
                </label>
              )}

              {selected === 'brute_force' && (
                <label className="flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={thenSuccess}
                    disabled={status.running}
                    onChange={(event) => setThenSuccess(event.target.checked)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                  Finish with a successful login (takeover test)
                </label>
              )}

              <Button
                type="button"
                className="w-full"
                loading={loading}
                disabled={!current || status.running}
                onClick={runSimulation}
              >
                <Play className="h-4 w-4" />
                {status.running ? 'Simulation Running' : 'Run Simulation'}
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Activity className="h-5 w-5 text-cyan-400" />
                Live progress
              </h2>
              <span className={`text-xs ${connected ? 'text-green-400' : 'text-amber-400'}`}>
                {connected ? 'Socket connected' : 'Socket disconnected'}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-300">
              {status.running
                ? `Running: ${status.scenario?.replaceAll('_', ' ')}`
                : 'No simulation currently running'}
            </p>

            {status.running && (
              <>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 font-mono text-xs text-slate-400">
                  {done} / {planned} events processed ({progress}%)
                </p>
              </>
            )}

            {!status.running && lastResult && (
              <p className="mt-3 text-sm text-green-400">
                Last run finished: {lastResult.events} events and{' '}
                {lastResult.threats} detected threats.
              </p>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-lg font-semibold text-white">
              Clean up test data
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Removes simulated records and their related notifications.
              Application-source records are not selected for deletion.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              loading={clearing}
              disabled={status.running || loading}
              onClick={clearSimulationData}
            >
              <Trash2 className="h-4 w-4" />
              Clear Simulated Data
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
