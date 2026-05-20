import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Ongeldige inloggegevens');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>S</div>
          <h1 style={styles.title}>SPOQ Partner Onboarding</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="naam@spoq.nl"
              required
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Wachtwoord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
  },
  card: {
    background: '#fff', borderRadius: 12, padding: 40, width: 400,
    boxShadow: '0 20px 40px rgba(0,0,0,.15)',
  },
  logo: { textAlign: 'center' as const, marginBottom: 32 },
  logoIcon: {
    width: 48, height: 48, borderRadius: 12, background: '#3b82f6',
    color: '#fff', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 22, fontWeight: 700, marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: 600, color: '#1f2937' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, outline: 'none',
  },
  error: {
    background: '#fef2f2', color: '#dc2626', padding: '8px 12px',
    borderRadius: 6, fontSize: 13, marginBottom: 16,
  },
  button: {
    width: '100%', padding: '10px 16px', background: '#1e40af', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
    marginTop: 8,
  },
};
