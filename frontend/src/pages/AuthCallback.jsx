import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

// After Google OAuth, the backend sets the cookie and redirects here.
// We re-fetch the user, then bounce to the right dashboard.
export default function AuthCallback() {
  const { refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await refresh();
      navigate('/', { replace: true });
    })();
  }, [refresh, navigate]);

  return (
    <div className="min-h-screen grid place-items-center text-text-mid">
      <div className="animate-pulse font-mono text-sm">Signing you in…</div>
    </div>
  );
}
