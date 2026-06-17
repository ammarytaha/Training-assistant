import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Loading spinner used inside the submit button.
function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin align-[-2px]" />
  );
}

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setServerError('');
  };

  // Client-side validation mirrors the backend rules.
  function validate() {
    const next = {};
    if (mode === 'register' && form.name.trim().length < 2) {
      next.name = 'Enter your name (2+ characters).';
    }
    if (!EMAIL_RE.test(form.email)) {
      next.email = 'Enter a valid email address.';
    }
    if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email.trim(), form.password, form.remember);
      } else {
        await register(form.name.trim(), form.email.trim(), form.password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Full-page redirect so Google's consent screen loads at top level.
  function googleSignIn() {
    window.location.href = '/auth/google';
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="font-black text-3xl tracking-tight leading-none">
            TRAIN<span className="text-accent">.</span>
          </div>
          <p className="text-text-mid text-sm mt-2">Your calisthenics coach, in your pocket.</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-text-mid text-sm mb-6">
            {mode === 'login' ? 'Log in to continue your training.' : 'Start tracking your progress today.'}
          </p>

          {serverError && (
            <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            {mode === 'register' && (
              <div className="mb-4">
                <label className="label" htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={`field ${errors.name ? 'field-error' : ''}`}
                  placeholder="Ammar Taha"
                  value={form.name}
                  onChange={set('name')}
                />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`field ${errors.email ? 'field-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={`field ${errors.password ? 'field-error' : ''}`}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center gap-2 text-sm text-text-mid cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="accent-accent w-4 h-4"
                    checked={form.remember}
                    onChange={set('remember')}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm text-accent hover:underline"
                  onClick={() => setServerError('Password reset is coming soon — contact your coach for now.')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="btn-accent flex items-center justify-center gap-2" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner /> {mode === 'login' ? 'Logging in…' : 'Creating…'}
                </>
              ) : mode === 'login' ? (
                'Log in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-dim uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={googleSignIn}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 bg-surface-2 border border-border-strong rounded-lg py-3 font-semibold hover:border-text-mid transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Mode toggle */}
          <p className="text-center text-sm text-text-mid mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="text-accent font-semibold hover:underline"
              onClick={() => {
                setMode((m) => (m === 'login' ? 'register' : 'login'));
                setErrors({});
                setServerError('');
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
