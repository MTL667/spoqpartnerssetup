import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';

export function Settings() {
  const { user } = useAuth();
  const [locale, setLocale] = useState(user?.locale ?? 'nl');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await api.patch('/i18n/locale', { locale });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Instellingen</h1>

      <Card style={{ maxWidth: 480 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Profiel</h2>
        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>E-mail</div>
          <div style={{ fontSize: 14, color: '#374151' }}>{user?.email}</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Rol</div>
          <div style={{ fontSize: 14, color: '#374151' }}>{user?.role}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Taal / Language</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={{
              padding: '8px 12px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 14, width: 200,
            }}
          >
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button onClick={handleSave}>Opslaan</Button>
          {saved && <span style={{ color: '#16a34a', fontSize: 13 }}>Opgeslagen!</span>}
        </div>
      </Card>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 4 };
