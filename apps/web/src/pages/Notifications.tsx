import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  entityType?: string;
  entityId?: string;
}

const TYPE_VARIANT: Record<string, string> = {
  TASK_ACTIVATED: 'blue', TASK_OVERDUE: 'red', DEADLINE_APPROACHING: 'orange',
  MENTION: 'blue', DELIVERABLE_UPLOADED: 'green', PREREQUISITE_FULFILLED: 'green',
};

export function Notifications() {
  const { data: notifications, refetch } = useApi<Notification[]>('/notifications');
  const { data: countData } = useApi<{ count: number }>('/notifications/count');

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    refetch();
  }

  async function markAllRead() {
    await api.post('/notifications/mark-all-read');
    refetch();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Notificaties</h1>
          {(countData?.count ?? 0) > 0 && (
            <Badge variant="red">{countData!.count} ongelezen</Badge>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={markAllRead}>Alles gelezen</Button>
      </div>

      <Card>
        {notifications?.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>Geen notificaties</p>
        )}
        {notifications?.map((n) => (
          <div
            key={n.id}
            style={{
              padding: '12px 0', borderBottom: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'flex-start', gap: 12,
              opacity: n.status === 'READ' ? 0.6 : 1,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge variant={TYPE_VARIANT[n.type] ?? 'gray'}>{n.type.replace(/_/g, ' ')}</Badge>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {new Date(n.createdAt).toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{n.message}</div>
            </div>
            {n.status === 'UNREAD' && (
              <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>✓</Button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
