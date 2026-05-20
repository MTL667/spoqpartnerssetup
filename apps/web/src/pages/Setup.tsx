import { FormEvent, useState } from 'react';
import { api } from '../api/client';

interface SetupProps {
  email: string;
  onComplete: () => void;
}

export function Setup({ email, onComplete }: SetupProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn');
      return;
    }
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/setup', { email, password });
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Setup mislukt');
    } finally {
      setLoading(false);
    }
  }

  const strength = getStrength(password);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>S</div>
          <h1 style={styles.title}>Welkom bij SPOQ</h1>
          <p style={styles.subtitle}>Stel je admin-account in om te beginnen</p>
        </div>

        <div style={styles.emailDisplay}>
          <span style={styles.emailLabel}>Account</span>
          <span style={styles.emailValue}>{email}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Kies een wachtwoord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Minimaal 8 tekens"
              required
              autoFocus
            />
            {password && (
              <div style={styles.strengthBar}>
                <div style={{
                  ...styles.strengthFill,
                  width: `${strength.pct}%`,
                  background: strength.color,
                }} />
              </div>
            )}
            {password && (
              <span style={{ fontSize: 12, color: strength.color }}>{strength.label}</span>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="confirm">Bevestig wachtwoord</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={styles.input}
              placeholder="Herhaal wachtwoord"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? 'Bezig...' : 'Account activeren'}
          </button>
        </form>
      </div>
    </div>
  );
}

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { pct: 20, color: '#ef4444', label: 'Zwak' };
  if (score <= 2) return { pct: 40, color: '#f97316', label: 'Matig' };
  if (score <= 3) return { pct: 60, color: '#eab308', label: 'Redelijk' };
  if (score <= 4) return { pct: 80, color: '#22c55e', label: 'Sterk' };
  return { pct: 100, color: '#16a34a', label: 'Zeer sterk' };
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
  },
  card: {
    background: '#fff', borderRadius: 12, padding: 40, width: 420,
    boxShadow: '0 20px 40px rgba(0,0,0,.15)',
  },
  logo: { textAlign: 'center' as const, marginBottom: 24 },
  logoIcon: {
    width: 48, height: 48, borderRadius: 12, background: '#3b82f6',
    color: '#fff', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 22, fontWeight: 700, marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: 600, color: '#1f2937', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', margin: 0 },
  emailDisplay: {
    background: '#f3f4f6', borderRadius: 8, padding: '10px 14px',
    marginBottom: 24, display: 'flex', justifyContent: 'space-between',
    alignItems: 'center',
  },
  emailLabel: { fontSize: 12, color: '#6b7280', fontWeight: 500 },
  emailValue: { fontSize: 14, color: '#1f2937', fontWeight: 600 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  },
  strengthBar: {
    height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 6, overflow: 'hidden',
  },
  strengthFill: {
    height: '100%', borderRadius: 2, transition: 'width 0.3s, background 0.3s',
  },
  error: {
    background: '#fef2f2', color: '#dc2626', padding: '8px 12px',
    borderRadius: 6, fontSize: 13, marginBottom: 16,
  },
  button: {
    width: '100%', padding: '10px 16px', background: '#1e40af', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
    marginTop: 8, cursor: 'pointer',
  },
};
