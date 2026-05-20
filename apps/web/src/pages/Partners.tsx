import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';

interface Onboarding {
  id: string;
  integrationType: string;
  contractType: string;
  status: string;
  partner: { id: string; companyName: string };
  phases: { name: string; status: string }[];
}

const INT_LABELS: Record<string, string> = {
  FORMS_ERP: 'Forms ERP', PARTNER_PORTAL: 'Partner Portal', API_INTEGRATION: 'API Integratie',
};
const CON_LABELS: Record<string, string> = { EXPERT_PARTNER: 'Expert-Partner', SOFTWARE_PARTNER: 'Software-Partner' };

export function Partners() {
  const { data: onboardings, loading, refetch } = useApi<Onboarding[]>('/onboardings');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactEmail: '', integrationType: 'FORMS_ERP', contractType: 'EXPERT_PARTNER' });
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.role === 'BDM' || user?.role === 'ADMIN';

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/onboardings', form);
      setShowForm(false);
      setForm({ companyName: '', contactEmail: '', integrationType: 'FORMS_ERP', contractType: 'EXPERT_PARTNER' });
      refetch();
    } finally { setSubmitting(false); }
  }

  if (loading) return <p style={{ color: '#6b7280' }}>Partners laden...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Partners</h1>
        {canCreate && <Button onClick={() => setShowForm(!showForm)}>+ Nieuwe Onboarding</Button>}
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Bedrijfsnaam" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} required />
            <Input label="Contact E-mail" type="email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} required />
            <Select label="Integratie Type" value={form.integrationType} onChange={(v) => setForm({ ...form, integrationType: v })}
              options={Object.entries(INT_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select label="Contract Type" value={form.contractType} onChange={(v) => setForm({ ...form, contractType: v })}
              options={Object.entries(CON_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
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
              <th style={thStyle}>Partner</th>
              <th style={thStyle}>Integratie</th>
              <th style={thStyle}>Contract</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Fase</th>
            </tr>
          </thead>
          <tbody>
            {onboardings?.map((o) => {
              const activePhase = o.phases.find((p) => p.status === 'IN_PROGRESS') ?? o.phases[0];
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                  onClick={() => navigate(`/onboarding/${o.id}`)}>
                  <td style={tdStyle}><strong>{o.partner.companyName}</strong></td>
                  <td style={tdStyle}>{INT_LABELS[o.integrationType] ?? o.integrationType}</td>
                  <td style={tdStyle}>{CON_LABELS[o.contractType] ?? o.contractType}</td>
                  <td style={tdStyle}><Badge variant={o.status === 'ACTIVE' ? 'green' : 'gray'}>{o.status}</Badge></td>
                  <td style={tdStyle}>{activePhase?.name ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Input({ label, value, onChange, ...props }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} {...props} />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '10px 12px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 };
