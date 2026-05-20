import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'DELIVERABLE' | 'COMMENT';
  deliverableRequirementId?: string;
  dueDate: string | null;
}

export function PartnerActions() {
  const { data: actions, loading, refetch } = useApi<ActionItem[]>('/partner-portal/action-items');

  if (loading) return <p style={{ color: '#6b7280' }}>Laden...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Mijn Acties</h1>

      {(!actions || actions.length === 0) && (
        <Card>
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>
            Geen openstaande acties. Alles is bijgewerkt!
          </p>
        </Card>
      )}

      {actions?.map((action) => (
        <ActionCard key={action.id} action={action} onDone={refetch} />
      ))}
    </div>
  );
}

function ActionCard({ action, onDone }: { action: ActionItem; onDone: () => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !action.deliverableRequirementId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('deliverableRequirementId', action.deliverableRequirementId);
      await api.post('/partner-portal/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onDone();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>{action.title}</h3>
            <Badge variant={action.type === 'DELIVERABLE' ? 'orange' : 'blue'}>
              {action.type === 'DELIVERABLE' ? 'Upload' : 'Reactie'}
            </Badge>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280' }}>{action.description}</p>
          {action.dueDate && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
              Deadline: {new Date(action.dueDate).toLocaleDateString('nl-NL')}
            </p>
          )}
        </div>
        {action.type === 'DELIVERABLE' && (
          <div>
            <label style={{ cursor: 'pointer' }}>
              <Button size="sm" disabled={uploading}>
                {uploading ? 'Uploaden...' : 'Bestand kiezen'}
              </Button>
              <input type="file" style={{ display: 'none' }} onChange={handleUpload} />
            </label>
          </div>
        )}
      </div>
    </Card>
  );
}
