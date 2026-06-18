import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin align-[-2px]" />;
}

// Public signup page reached via a coach's invite link (/join/:token).
// Creating an account here auto-links the new trainee to that coach.
export default function Join() {
  const { token } = useParams();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [coach, setCoach] = useState(null);
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/auth/invite/${token}`);
        setCoach(data.coach);
      } catch (err) {
        setInvalid(err.message || 'This invite link is invalid or has expired.');
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setServerError('');
  };

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your name (2+ characters).';
    if (!EMAIL_RE.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      await register(form.name.trim(), form.email.trim(), form.password, { inviteToken: token });
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function googleJoin() {
    window.location.href = `/auth/google?invite=${encodeURIComponent(token)}`;
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center text-text-mid">
        <div className="animate-pulse font-mono text-sm">Checking invite…</div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-md text-center bg-surface border border-border rounded-2xl p-8">
          <div className="text-4xl mb-3">🔗</div>
          <h1 className="text-xl font-extrabold mb-2">Invite not available</h1>
          <p className="text-text-mid text-sm mb-6">{invalid}</p>
          <Link to="/login" className="text-accent font-semibold hover:underline">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="font-black text-3xl tracking-tight leading-none">
            TRAIN<span className="text-accent">.</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 bg-accent/5 border border-accent/30 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-strong grid place-items-center font-bold text-accent shrink-0">
              {coach?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="text-sm">
              <span className="text-text-mid">You're joining</span>{' '}
              <span className="font-bold">{coach?.name}</span>
              <span className="text-text-mid"> as a trainee.</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Create your account</h1>
          <p className="text-text-mid text-sm mb-6">Set up your login to start training.</p>

          {serverError && (
            <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{serverError}</div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="mb-4">
              <label className="label" htmlFor="name">Name</label>
              <input id="name" type="text" autoComplete="name" className={`field ${errors.name ? 'field-error' : ''}`} placeholder="Ammar Taha" value={form.name} onChange={set('name')} />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
            </div>
            <div className="mb-4">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" className={`field ${errors.email ? 'field-error' : ''}`} placeholder="you@example.com" value={form.email} onChange={set('email')} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
            </div>
            <div className="mb-6">
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="new-password" className={`field ${errors.password ? 'field-error' : ''}`} placeholder="At least 8 characters" value={form.password} onChange={set('password')} />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-accent flex items-center justify-center gap-2" disabled={submitting}>
              {submitting ? (<><Spinner /> Creating…</>) : 'Create account & join'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-dim uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button type="button" onClick={googleJoin} disabled={submitting} className="w-full flex items-center justify-center gap-3 bg-surface-2 border border-border-strong rounded-lg py-3 font-semibold hover:border-text-mid transition-colors disabled:opacity-50">
            Continue with Google
          </button>

          <p className="text-center text-sm text-text-mid mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
