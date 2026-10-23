import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Lock, ShieldAlert } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

const POINTS = [
  { icon: Activity, text: 'Live security event feed over Socket.IO' },
  { icon: ShieldAlert, text: 'Rule-based detection with plain-English explanations' },
  { icon: Lock, text: 'Hashed passwords, JWT auth and account lockout' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 p-12 lg:flex">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <Link to="/" className="relative"><Logo /></Link>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Intelligent threat detection.<br /><span className="text-gradient">Real-time protection.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-300">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/20"><Icon className="h-4 w-4 text-cyan-300" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">Educational project. Demo events are synthetic.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          <div className="glass rounded-2xl p-7 sm:p-8">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-5 text-center text-sm text-slate-400">{footer}</p>
        </motion.div>
      </div>
    </div>
  );
}