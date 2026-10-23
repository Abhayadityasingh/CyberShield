import { NavLink } from 'react-router-dom';
import {
  Activity, BrainCircuit, FileText, FlaskConical, Globe, LayoutDashboard,
  PanelLeftClose, PanelLeftOpen, Settings, ShieldAlert,
} from 'lucide-react';
import Logo from '../ui/Logo.jsx';

// Items marked `soon` are pages for later phases. They are disabled, not fake.
const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/threats', label: 'Threat Detection', icon: ShieldAlert },
  { to: '/app/monitoring', label: 'Live Monitoring', icon: Activity },
  { to: '/app/simulation', label: 'Simulation Lab', icon: FlaskConical },
  { label: 'Threat Intelligence', icon: Globe, soon: 'Phase 7' },
  { label: 'AI Risk Analysis', icon: BrainCircuit, soon: 'Phase 6' },
  { label: 'Reports', icon: FileText, soon: 'Phase 7' },
  { label: 'Settings', icon: Settings, soon: 'Phase 7' },
];
export default function Sidebar({ collapsed, onToggle, mobileOpen }) {
  const hideLabel = collapsed ? 'lg:hidden' : '';
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-ink-900/95 backdrop-blur transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}`}
    >
      <div className={`flex h-16 items-center border-b border-white/5 px-4 ${collapsed ? 'lg:justify-center' : ''}`}>
        <Logo compact={collapsed} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
        {NAV.map((item) => {
          const Icon = item.icon;
          if (item.soon) {
            return (
              <div
                key={item.label}
                title={`Coming in ${item.soon}`}
                aria-disabled="true"
                className={`flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 ${collapsed ? 'lg:justify-center' : ''}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={`flex-1 truncate ${hideLabel}`}>{item.label}</span>
                <span className={`rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase ${hideLabel}`}>{item.soon}</span>
              </div>
            );
          }
          return (
            <NavLink
              key={item.label}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${collapsed ? 'lg:justify-center' : ''} ${
                  isActive
                    ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={`truncate ${hideLabel}`}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="hidden border-t border-white/5 p-3 lg:block">
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-100 ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}