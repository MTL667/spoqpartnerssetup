import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { api } from '../api/client';

interface Task {
  id: string;
  title: string;
  status: string;
  ownerRole: string;
  dueDate: string | null;
  checklistItems: { id: string; text: string; checked: boolean }[];
  deliverableRequirements: { id: string; title: string; fulfilled: boolean }[];
  subTasks: { id: string; title: string; status: string }[];
  phase: { name: string; sequence: number };
}

interface DrillDown {
  id: string;
  title: string;
  status: string;
  ownerRole: string;
  dueDate: string | null;
  blockingReason?: string;
}

const STATUS_VARIANT: Record<string, string> = {
  NOT_ACTIVE: 'gray', ACTIVE: 'blue', BLOCKED: 'red', OVERDUE: 'orange', COMPLETED: 'green',
};

export function OnboardingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: tasks, loading, refetch } = useApi<Task[]>(`/tasks/onboarding/${id}`);
  const { data: drillDown } = useApi<DrillDown[]>(`/dashboard/drill-down/${id}`);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (loading) return <p style={{ color: '#6b7280' }}>Laden...</p>;

  const phases = new Map<string, Task[]>();
  tasks?.forEach((t) => {
    const key = `${t.phase.sequence}. ${t.phase.name}`;
    if (!phases.has(key)) phases.set(key, []);
    phases.get(key)!.push(t);
  });

  const blockedTasks = drillDown?.filter((t) => t.blockingReason) ?? [];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Onboarding Detail</h1>

      {blockedTasks.length > 0 && (
        <Card style={{ marginBottom: 20, borderColor: '#fecaca', background: '#fef2f2' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Blokkades</h3>
          {blockedTasks.map((t) => (
            <div key={t.id} style={{ fontSize: 13, marginBottom: 6, color: '#7f1d1d' }}>
              <strong>{t.title}</strong> ({t.ownerRole}) — {t.blockingReason}
            </div>
          ))}
        </Card>
      )}

      {Array.from(phases.entries()).map(([phaseName, phaseTasks]) => {
        const completed = phaseTasks.filter((t) => t.status === 'COMPLETED').length;
        return (
          <Card key={phaseName} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{phaseName}</h2>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{completed}/{phaseTasks.length} taken</span>
            </div>
            <ProgressBar value={completed} max={phaseTasks.length} />
            <div style={{ marginTop: 12 }}>
              {phaseTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  expanded={expandedTask === task.id}
                  onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  onRefresh={refetch}
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function TaskRow({ task, expanded, onToggle, onRefresh }: { task: Task; expanded: boolean; onToggle: () => void; onRefresh: () => void }) {
  async function toggleChecklist(itemId: string) {
    await api.patch(`/tasks/checklist/${itemId}/toggle`);
    onRefresh();
  }

  async function completeTask() {
    await api.post(`/tasks/${task.id}/complete`);
    onRefresh();
  }

  return (
    <div style={{ borderBottom: '1px solid #f3f4f6', padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={onToggle}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '▼' : '▶'}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{task.title}</span>
        <Badge variant={STATUS_VARIANT[task.status] ?? 'gray'}>{task.status}</Badge>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{task.ownerRole}</span>
        {task.dueDate && (
          <span style={{ fontSize: 12, color: '#6b7280' }}>{new Date(task.dueDate).toLocaleDateString('nl-NL')}</span>
        )}
      </div>
      {expanded && (
        <div style={{ paddingLeft: 24, paddingTop: 8 }}>
          {task.checklistItems.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Checklist</div>
              {task.checklistItems.map((item) => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 2, cursor: 'pointer' }}>
                  <input type="checkbox" checked={item.checked} onChange={() => toggleChecklist(item.id)}
                    disabled={task.status !== 'ACTIVE' && task.status !== 'OVERDUE'} />
                  <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#9ca3af' : '#1f2937' }}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          )}
          {task.deliverableRequirements.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Deliverables</div>
              {task.deliverableRequirements.map((dr) => (
                <div key={dr.id} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: dr.fulfilled ? '#16a34a' : '#dc2626' }}>{dr.fulfilled ? '✓' : '○'}</span>
                  {dr.title}
                </div>
              ))}
            </div>
          )}
          {task.subTasks.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Subtaken</div>
              {task.subTasks.map((st) => (
                <div key={st.id} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Badge variant={STATUS_VARIANT[st.status] ?? 'gray'}>{st.status}</Badge>
                  {st.title}
                </div>
              ))}
            </div>
          )}
          {(task.status === 'ACTIVE' || task.status === 'OVERDUE') &&
            task.checklistItems.every((i) => i.checked) &&
            task.deliverableRequirements.every((d) => d.fulfilled) && (
              <Button size="sm" onClick={completeTask}>Taak afronden</Button>
            )}
        </div>
      )}
    </div>
  );
}
