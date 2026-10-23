import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, BrainCircuit, Database, FileText, FlaskConical, Globe,
  Radio, Server, ShieldAlert, Zap,
} from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import GlassCard from '../components/ui/GlassCard.jsx';
import { buttonStyles } from '../components/ui/Button.jsx';
import { Pill, SeverityBadge } from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: Radio, title: 'Real-time monitoring', text: 'Security events stream to your dashboard the moment they happen, over Socket.IO.' },
  { icon: ShieldAlert, title: 'Rule-based detection', text: 'Six explainable rules catch brute force, credential stuffing, odd hours and location jumps.' },
  { icon: FlaskConical, title: 'Simulation Lab', text: 'Generate synthetic attack scenarios safely. Nothing leaves the app, and everything is labelled.' },
  { icon: BrainCircuit, title: 'AI risk scoring', text: 'Anomaly-detection model with explainable scores.', planned: true },
  { icon: Globe, title: 'Threat intelligence', text: 'IP context, categories and incident statistics at a glance.', planned: true },
  { icon: FileText, title: 'Security reports', text: 'Filter history, export CSV and generate PDF summaries.', planned: true },
];

const STEPS = [
  { n: '01', title: 'Ingest', text: 'Every login attempt is recorded as an event with IP, time and outcome.' },
  { n: '02', title: 'Detect', text: 'The engine compares each event with recent history using transparent rules.' },
  { n: '03', title: 'Alert', text: 'Threats get a severity, a risk score and a plain-English explanation.' },
  { n: '04', title: 'Investigate', text: 'Analysts review live feeds, notifications and incident details.' },
];

const TECH = ['React', 'Tailwind CSS', 'Framer Motion', 'Node.js', 'Express', 'MongoDB', 'Socket.IO', 'JWT', 'Python', 'scikit-learn'];

const SAMPLE = [
  { severity: 'critical', text: 'Successful login after repeated failures' },
  { severity: 'high', text: 'Login country changed within an hour' },
  { severity: 'medium', text: 'Login at an unusual time' },
  { severity: 'low', text: 'Failed login (wrong password)' },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

function Radar() {
  return (
    <svg viewBox="0 0 200 200" className="h-44 w-44 sm:h-56 sm:w-56" aria-hidden="true">
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity=".25" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity=".55" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#rg)" />
      {[32, 64, 96].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#22d3ee" strokeOpacity=".25" />)}
      <line x1="4" y1="100" x2="196" y2="100" stroke="#22d3ee" strokeOpacity=".15" />
      <line x1="100" y1="4" x2="100" y2="196" stroke="#22d3ee" strokeOpacity=".15" />
      <g className="radar-sweep"><path d="M100 100 L196 100 A96 96 0 0 0 168 32 Z" fill="url(#sw)" /></g>
      <circle cx="140" cy="66" r="3.5" fill="#f87171" />
      <circle cx="70" cy="128" r="3" fill="#fbbf24" />
      <circle cx="100" cy="100" r="4" fill="#22d3ee" />
    </svg>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const startTo = user ? '/app/dashboard' : '/register';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex" aria-label="Sections">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#tech" className="hover:text-white">Technology</a>
          </nav>
          <div className="flex items-center gap-2">
            {!user && <Link to="/login" className={buttonStyles('ghost', 'sm')}>Sign in</Link>}
            <Link to={startTo} className={buttonStyles('primary', 'sm')}>{user ? 'Open dashboard' : 'Get started'}</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Pill className="mb-5 bg-cyan-400/10 text-cyan-300 ring-cyan-400/25"><Zap className="mr-1 h-3 w-3" /> Security monitoring platform</Pill>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Intelligent Threat Detection.<br /><span className="text-gradient">Real-Time Protection.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-400">
              CyberShield analyses login activity, flags suspicious behaviour with explainable rules and streams
              every incident to a live security dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={startTo} className={buttonStyles('primary', 'lg')}>Get started <ArrowRight className="h-4 w-4" /></Link>
              <a href="#how" className={buttonStyles('outline', 'lg')}>See how it works</a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <GlassCard className="relative p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-100"><Activity className="h-4 w-4 text-cyan-300" /> Threat feed</div>
                <Pill className="bg-violet-500/15 text-violet-300 ring-violet-400/25">Illustrative sample</Pill>
              </div>
              <div className="flex items-center gap-4">
                <Radar />
                <ul className="min-w-0 flex-1 space-y-2.5">
                  {SAMPLE.map((s) => (
                    <li key={s.text} className="flex items-center gap-2 rounded-lg bg-white/[.03] px-3 py-2 text-xs text-slate-300">
                      <SeverityBadge severity={s.severity} /> <span className="truncate">{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-[11px] text-slate-500">Sample data for illustration only. The live dashboard shows your own events.</p>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <motion.div {...fadeUp} className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white">Everything a small SOC needs</h2>
          <p className="mt-3 text-slate-400">Built end to end: events in, explainable threats out, live to your screen.</p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, planned }, i) => (
            <motion.div key={title} {...fadeUp} transition={{ duration: 0.45, delay: i * 0.05 }}>
              <GlassCard hover className="h-full p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20"><Icon className="h-5 w-5 text-cyan-300" /></span>
                  {planned && <Pill className="bg-white/5 text-slate-400 ring-white/10">Planned</Pill>}
                </div>
                <h3 className="font-semibold text-slate-100">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{text}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <motion.h2 {...fadeUp} className="mb-12 text-3xl font-bold tracking-tight text-white">How it works</motion.h2>
        <div className="grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} {...fadeUp} transition={{ duration: 0.45, delay: i * 0.08 }}>
              <GlassCard className="h-full p-6">
                <span className="font-mono text-sm text-cyan-300">{s.n}</span>
                <h3 className="mt-3 font-semibold text-slate-100">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{s.text}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="tech" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
        <motion.div {...fadeUp}>
          <GlassCard className="p-8">
            <div className="mb-5 flex items-center gap-2 text-slate-100"><Server className="h-5 w-5 text-cyan-300" /><Database className="h-5 w-5 text-violet-300" /><h2 className="ml-1 text-xl font-semibold">Technology</h2></div>
            <div className="flex flex-wrap gap-2">
              {TECH.map((t) => <span key={t} className="rounded-lg bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300 ring-1 ring-white/10">{t}</span>)}
            </div>
          </GlassCard>
        </motion.div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-center sm:text-right">An educational project. All demo events are simulated and never target real systems.</p>
        </div>
      </footer>
    </div>
  );
}