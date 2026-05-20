import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface Alert {
  partnerId: string;
  companyName: string;
  onboardingId: string;
  severity: 'red' | 'orange' | 'green';
  blockedTasks: number;
  overdueTasks: number;
  atRiskTasks: number;
  totalTasks: number;
  completedTasks: number;
}

const SEVERITY_LABEL: Record<string, string> = { red: 'Kritiek', orange: 'Aandacht', green: 'Op schema' };

export function Dashboard() {
  const { data: alerts, loading } = useApi<Alert[]>('/dashboard/alerts');
  const navigate = useNavigate();

  if (loading) return <p style={{ color: '#6b7280' }}>Dashboard laden...</p>;

  const red = alerts?.filter((a) => a.severity === 'red').length ?? 0;
  const orange = alerts?.filter((a) => a.severity === 'orange').length ?? 0;
  const green = alerts?.filter((a) => a.severity === 'green').length ?? 0;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Dashboard</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <SummaryCard count={red} label="Kritiek" color="#dc2626" bg="#fef2f2" />
        <SummaryCard count={orange} label="Aandacht" color="#ea580c" bg="#fff7ed" />
        <SummaryCard count={green} label="Op schema" color="#16a34a" bg="#f0fdf4" />
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={thStyle}>Partner</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Geblokkeerd</th>
              <th style={thStyle}>Te laat</th>
              <th style={thStyle}>Risico</th>
              <th style={thStyle}>Voortgang</th>
            </tr>
          </thead>
          <tbody>
            {alerts?.map((alert) => (
              <tr
                key={alert.onboardingId}
                style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                onClick={() => navigate(`/onboarding/${alert.onboardingId}`)}
              >
                <td style={tdStyle}><strong>{alert.companyName}</strong></td>
                <td style={tdStyle}><Badge variant={alert.severity}>{SEVERITY_LABEL[alert.severity]}</Badge></td>
                <td style={tdStyle}>{alert.blockedTasks}</td>
                <td style={tdStyle}>{alert.overdueTasks}</td>
                <td style={tdStyle}>{alert.atRiskTasks}</td>
                <td style={tdStyle}>{alert.completedTasks}/{alert.totalTasks}</td>
              </tr>
            ))}
            {(!alerts || alerts.length === 0) && (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>Geen actieve onboardings</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SummaryCard({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <Card style={{ flex: 1, background: bg, borderColor: color + '33' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: 13, color, fontWeight: 500, marginTop: 4 }}>{label}</div>
    </Card>
  );
}

const thStyle: React.CSSProperties = { padding: '10px 12px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px', verticalAlign: 'middle' };
