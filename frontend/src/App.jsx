import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import TraineeDashboard from './pages/TraineeDashboard';
import CoachDashboard from './pages/CoachDashboard';

// Gate routes behind auth; coaches land on the coach dashboard.
function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-text-mid">
        <div className="animate-pulse font-mono text-sm">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'coach' || user.role === 'admin') return <Navigate to="/coach" replace />;
  return <Navigate to="/train" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/" element={<Home />} />
      <Route
        path="/train"
        element={
          <Protected>
            <TraineeDashboard />
          </Protected>
        }
      />
      <Route
        path="/coach"
        element={
          <Protected role="coach">
            <CoachDashboard />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
