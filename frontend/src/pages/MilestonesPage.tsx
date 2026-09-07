import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

export default function MilestonesPage() {
  const { workspaceId, projectId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const { data: milestonesRes, isLoading } = useQuery<any>({
    queryKey: ['milestones', projectId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/milestones`)
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/milestones`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
    }
  });

  const milestones = milestonesRes?.data || [];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Milestones</h2>
        <button className="primary-button" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Create Milestone'}
        </button>
      </div>

      {isCreating && (
        <form 
          style={{ padding: '24px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ title: newTitle, description: newDesc, dueDate: newDueDate });
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
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
          </div>
          <button type="submit" className="primary-button" disabled={createMutation.isPending || !newTitle}>Save</button>
        </form>
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {milestones.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No milestones found.</p>
          ) : (
            milestones.map((m: any) => (
              <div key={m.id} style={{ padding: '16px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{m.title}</h3>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{m.description || 'No description'}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', backgroundColor: m.status === 'DONE' ? '#e3fcef' : '#ebecf0', color: m.status === 'DONE' ? '#006644' : '#42526e' }}>
                      {m.status}
                    </span>
                    {m.dueDate && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Due: {new Date(m.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Issues attached: {m._count?.issues || 0}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
