import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export default function EpicsPage() {
  const { workspaceId, projectId } = useParams();
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: epicsRes, isLoading } = useQuery<any>({
    queryKey: ['epics', projectId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/issues?type=EPIC`)
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/issues`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
    }
  });

  const epics = epicsRes?.data?.filter((i: any) => i.type === 'EPIC') || [];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Epics</h2>
        <button className="primary-button" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Create Epic'}
        </button>
      </div>

      {isCreating && (
        <form 
          style={{ padding: '24px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ title: newTitle, description: newDesc, type: 'EPIC' });
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Title</label>
            <input type="text" className="form-input" required value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Description</label>
            <textarea className="form-input" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          </div>
          <button type="submit" className="primary-button" disabled={createMutation.isPending || !newTitle}>Save</button>
        </form>
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {epics.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No epics found.</p>
          ) : (
            epics.map((epic: any) => (
              <div key={epic.id} style={{ padding: '16px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: 'rgba(101, 84, 192, 0.1)', color: '#6554c0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>🟪 EPIC</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{epic.key}</span>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>{epic.title}</h3>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Status: {epic.status?.title || 'Unknown'}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
