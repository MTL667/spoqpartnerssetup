import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  locale: string;
  createdAt: string;
}

const ROLES = ['ADMIN', 'BDM', 'BD', 'IT', 'MARKETING', 'SALES', 'PARTNER'];

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  details: { name: string; tasks: number; progress: number }[];
}

export function AdminUsers() {
  const { data: users, refetch } = useApi<User[]>('/admin/users');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'BDM', locale: 'nl' });
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Import mislukt');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/users', form);
      setShowForm(false);
      setForm({ email: '', password: '', role: 'BDM', locale: 'nl' });
      refetch();
    } finally { setSubmitting(false); }
  }

  async function toggleStatus(user: User) {
    if (user.status === 'ACTIVE') {
      await api.patch(`/admin/users/${user.id}/deactivate`);
    } else {
      await api.patch(`/admin/users/${user.id}/reactivate`);
    }
    refetch();
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Excel Import</h2>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              Upload een Partner Overview & Onboarding Excel (.xlsx) om partners en taken te importeren.
            </p>
          </div>
          <label style={{ cursor: importing ? 'wait' : 'pointer' }}>
            <Button disabled={importing}>
              {importing ? 'Importeren...' : 'Excel uploaden'}
            </Button>
            <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} disabled={importing} />
          </label>
        </div>
        {importError && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13 }}>
            {importError}
          </div>
        )}
        {importResult && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
              <Badge variant="green">{importResult.imported} geïmporteerd</Badge>
              {importResult.skipped > 0 && <Badge variant="gray">{importResult.skipped} overgeslagen</Badge>}
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                {importResult.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            {importResult.details.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', fontWeight: 600, color: '#6b7280' }}>Partner</th>
                    <th style={{ padding: '6px 8px', fontWeight: 600, color: '#6b7280' }}>Taken</th>
                    <th style={{ padding: '6px 8px', fontWeight: 600, color: '#6b7280' }}>Voortgang</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.details.map((d) => (
                    <tr key={d.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 8px' }}>{d.name}</td>
                      <td style={{ padding: '6px 8px' }}>{d.tasks}</td>
                      <td style={{ padding: '6px 8px' }}>{d.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Gebruikersbeheer</h1>
        <Button onClick={() => setShowForm(!showForm)}>+ Nieuwe Gebruiker</Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Wachtwoord</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={inputStyle} required minLength={8} />
            </div>
            <div>
              <label style={labelStyle}>Rol</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Taal</label>
              <select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} style={inputStyle}>
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Annuleer</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Bezig...' : 'Aanmaken'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={thStyle}>E-mail</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Taal</th>
              <th style={thStyle}>Acties</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}><Badge variant="blue">{u.role}</Badge></td>
                <td style={tdStyle}>
                  <Badge variant={u.status === 'ACTIVE' ? 'green' : 'red'}>{u.status}</Badge>
                </td>
                <td style={tdStyle}>{u.locale === 'nl' ? 'NL' : 'EN'}</td>
                <td style={tdStyle}>
                  <Button variant={u.status === 'ACTIVE' ? 'danger' : 'primary'} size="sm" onClick={() => toggleStatus(u)}>
                    {u.status === 'ACTIVE' ? 'Deactiveer' : 'Activeer'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '10px 12px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px' };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 };
