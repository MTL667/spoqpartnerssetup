import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { api } from './api/client';
import { Login } from './pages/Login';
import { Setup } from './pages/Setup';
import { AppShell } from './components/AppShell';

export function App() {
  const { user, loading, refresh } = useAuth();
  const [setupStatus, setSetupStatus] = useState<{ needsSetup: boolean; email: string | null } | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    api.get('/auth/setup-check')
      .then((res) => setSetupStatus(res.data))
      .catch(() => setSetupStatus({ needsSetup: false, email: null }))
      .finally(() => setCheckingSetup(false));
  }, []);

  if (loading || checkingSetup) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#3b82f6', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, marginBottom: 12,
          }}>S</div>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Laden...</p>
        </div>
      </div>
    );
  }

  if (setupStatus?.needsSetup && setupStatus.email) {
    return (
      <Setup
        email={setupStatus.email}
        onComplete={() => {
          setSetupStatus({ needsSetup: false, email: null });
          refresh();
        }}
      />
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={user ? <AppShell /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
