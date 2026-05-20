import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';

interface PhaseProgress {
  name: string;
  sequence: number;
  status: string;
  totalTasks: number;
  completedTasks: number;
}

interface ProgressData {
  companyName: string;
  overallPercentage: number;
  currentPhase: string;
  phases: PhaseProgress[];
  schedule: { goLiveDate: string | null; estimatedCompletion: string | null };
}

const PHASE_VARIANT: Record<string, string> = {
  COMPLETED: 'green', IN_PROGRESS: 'blue', NOT_STARTED: 'gray',
};

export function PartnerProgress() {
  const { data: progress, loading } = useApi<ProgressData>('/partner-portal/progress');

  if (loading) return <p style={{ color: '#6b7280' }}>Laden...</p>;
  if (!progress) return <p style={{ color: '#9ca3af' }}>Geen onboarding gevonden.</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{progress.companyName}</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
        Huidige fase: <strong>{progress.currentPhase}</strong>
        {progress.schedule.goLiveDate && (
          <> — Go-live: <strong>{new Date(progress.schedule.goLiveDate).toLocaleDateString('nl-NL')}</strong></>
        )}
      </p>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#1e40af' }}>{progress.overallPercentage}%</span>
          <span style={{ fontSize: 14, color: '#6b7280' }}>totale voortgang</span>
        </div>
        <ProgressBar value={progress.overallPercentage} color="#1e40af" />
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {progress.phases.map((phase) => (
          <Card key={phase.sequence}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                {phase.sequence}. {phase.name}
              </h3>
              <Badge variant={PHASE_VARIANT[phase.status] ?? 'gray'}>{phase.status}</Badge>
            </div>
            <ProgressBar
              value={phase.completedTasks}
              max={phase.totalTasks || 1}
              color={phase.status === 'COMPLETED' ? '#16a34a' : '#3b82f6'}
            />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {phase.completedTasks}/{phase.totalTasks} taken afgerond
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
