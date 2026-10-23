import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../lib/api.js';

// Same rules as the backend (Zod): the server remains the real gatekeeper
const rulesFor = (pw) => [
  { ok: pw.length >= 8 && pw.length <= 72, label: '8 to 72 characters' },
  { ok: /[a-z]/.test(pw), label: 'A lowercase letter' },
  { ok: /[A-Z]/.test(pw), label: 'An uppercase letter' },
  { ok: /[0-9]/.test(pw), label: 'A number' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const rules = rulesFor(form.password);

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!rules.every((r) => r.ok)) next.password = 'Password does not meet all requirements';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success('Account created. Welcome to CyberShield!');
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start monitoring in under a minute."
      footer={<>Already have an account? <Link to="/login" className="text-cyan-300 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</div>}
        <Input label="Full name" name="name" autoComplete="name" icon={User} placeholder="Your name" value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" name="email" type="email" autoComplete="email" icon={Mail} placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
        <div>
          <Input label="Password" name="password" type="password" autoComplete="new-password" icon={Lock} placeholder="Create a strong password" value={form.password} onChange={set('password')} error={errors.password} />
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {rules.map((r) => (
              <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-emerald-300' : 'text-slate-500'}`}>
                <Check className={`h-3 w-3 ${r.ok ? 'opacity-100' : 'opacity-30'}`} /> {r.label}
              </li>
            ))}
          </ul>
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">Create account</Button>
      </form>
    </AuthShell>
  );
}