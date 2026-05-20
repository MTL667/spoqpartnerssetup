import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface Template {
  id: string;
  integrationType: string;
  contractType: string;
  version: number;
  active: boolean;
  createdAt: string;
  blueprints: { id: string; title: string; phaseSequence: number; ownerRole: string }[];
}

const INT_LABELS: Record<string, string> = {
  FORMS_ERP: 'Forms ERP', PARTNER_PORTAL: 'Partner Portal', API_INTEGRATION: 'API Integratie',
};
const CON_LABELS: Record<string, string> = { EXPERT_PARTNER: 'Expert-Partner', SOFTWARE_PARTNER: 'Software-Partner' };

export function Templates() {
  const { data: formsExpert } = useApi<Template[]>('/templates/history/FORMS_ERP/EXPERT_PARTNER');
  const { data: formsSwp } = useApi<Template[]>('/templates/history/FORMS_ERP/SOFTWARE_PARTNER');
  const { data: portalExpert } = useApi<Template[]>('/templates/history/PARTNER_PORTAL/EXPERT_PARTNER');
  const { data: portalSwp } = useApi<Template[]>('/templates/history/PARTNER_PORTAL/SOFTWARE_PARTNER');
  const { data: apiExpert } = useApi<Template[]>('/templates/history/API_INTEGRATION/EXPERT_PARTNER');
  const { data: apiSwp } = useApi<Template[]>('/templates/history/API_INTEGRATION/SOFTWARE_PARTNER');

  const allTemplates = [
    ...(formsExpert ?? []), ...(formsSwp ?? []),
    ...(portalExpert ?? []), ...(portalSwp ?? []),
    ...(apiExpert ?? []), ...(apiSwp ?? []),
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Templates</h1>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={thStyle}>Integratie</th>
              <th style={thStyle}>Contract</th>
              <th style={thStyle}>Versie</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Taken</th>
              <th style={thStyle}>Aangemaakt</th>
            </tr>
          </thead>
          <tbody>
            {allTemplates.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={tdStyle}>{INT_LABELS[t.integrationType] ?? t.integrationType}</td>
                <td style={tdStyle}>{CON_LABELS[t.contractType] ?? t.contractType}</td>
                <td style={tdStyle}>v{t.version}</td>
                <td style={tdStyle}>
                  <Badge variant={t.active ? 'green' : 'gray'}>{t.active ? 'Actief' : 'Draft'}</Badge>
                </td>
                <td style={tdStyle}>{t.blueprints?.length ?? 0}</td>
                <td style={tdStyle}>{new Date(t.createdAt).toLocaleDateString('nl-NL')}</td>
              </tr>
            ))}
            {allTemplates.length === 0 && (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>Geen templates gevonden</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '10px 12px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px' };
