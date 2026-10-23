import { io } from 'socket.io-client';

const [, , email, password, scenario] = process.argv;
const base = 'http://localhost:5000';
if (!email || !password) {
  console.error('Usage: node src/scripts/socketClient.js <email> <password> [scenario]');
  process.exit(1);
}

const login = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
}).then((r) => r.json());
if (!login.token) {
  console.error('Login failed:', login.message);
  process.exit(1);
}

const socket = io(base, { auth: { token: login.token } });
const t = () => new Date().toISOString().slice(11, 19);

socket.on('connect_error', (e) => { console.error('Connect error:', e.message); process.exit(1); });
socket.on('connected', (m) => console.log(`${t()} [socket] ${m.message}`));
socket.on('security-event', (e) =>
  console.log(`${t()} [feed]   ${e.severity.toUpperCase().padEnd(8)} ${e.message}  (${e.source})`));
socket.on('threat', (th) =>
  console.log(`${t()} [THREAT] ${th.severity.toUpperCase()} ${th.title}  risk=${th.riskScore}`));
socket.on('notification', (n) => console.log(`${t()} [notify] ${n.title}`));
socket.on('simulation', (s) => {
  console.log(`${t()} [sim]    ${s.status}`, s.done !== undefined ? `${s.done}/${s.planned}` : '');
  if (s.status === 'finished' || s.status === 'failed') setTimeout(() => process.exit(0), 800);
});

socket.on('connect', async () => {
  if (!scenario) return console.log('Listening. Trigger a scenario from another terminal. Ctrl+C to stop.');
  const res = await fetch(`${base}/api/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ scenario }),
  }).then((r) => r.json());
  console.log(`${t()} [api]    run ->`, res.success ? `${res.plannedEvents} events planned` : res.message);
});