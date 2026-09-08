import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function AutomationPage() {
  const { workspaceId, projectId } = useParams();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', description: '', triggerType: 'ISSUE_CREATED', actionType: 'ASSIGN_USER' });

  const { data: automationsRes, isLoading } = useQuery({
    queryKey: ['automations', projectId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/automations`),
    enabled: !!workspaceId && !!projectId,
  });

  const automations = automationsRes?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (ruleData: any) => apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/automations`, ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', projectId] });
      setIsCreating(false);
      setNewRule({ name: '', description: '', triggerType: 'ISSUE_CREATED', actionType: 'ASSIGN_USER' });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}/automations/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations', projectId] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/workspaces/${workspaceId}/projects/${projectId}/automations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations', projectId] })
  });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><LoadingSpinner /></div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Automations</h1>
        <button 
          onClick={() => setIsCreating(true)}
          style={{ padding: '8px 16px', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Create Rule
        </button>
      </div>

      {isCreating && (
        <div style={{ padding: '24px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>New Automation Rule</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Rule Name</label>
              <input 
                value={newRule.name}
                onChange={e => setNewRule({...newRule, name: e.target.value})}
                placeholder="e.g., Auto-assign backend bugs"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Trigger</label>
              <select 
                value={newRule.triggerType}
                onChange={e => setNewRule({...newRule, triggerType: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              >
                <option value="ISSUE_CREATED">When Issue is Created</option>
                <option value="STATUS_CHANGED">When Status is Changed</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Action</label>
              <select 
                value={newRule.actionType}
                onChange={e => setNewRule({...newRule, actionType: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              >
                <option value="ASSIGN_USER">Assign to User</option>
                <option value="SET_PRIORITY">Set Priority</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => createMutation.mutate(newRule)}
                disabled={!newRule.name || createMutation.isPending}
                style={{ padding: '8px 16px', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {createMutation.isPending ? 'Saving...' : 'Save Rule'}
              </button>
              <button 
                onClick={() => setIsCreating(false)}
                style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {automations.length === 0 && !isCreating ? (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No automation rules configured yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {automations.map((rule: any) => (
            <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{rule.name}</h4>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: rule.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)', color: rule.isActive ? '#10b981' : '#6b7280', fontWeight: 500 }}>
                    {rule.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <strong>When:</strong> {rule.triggerType} ➔ <strong>Then:</strong> {rule.actionType}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                  style={{ padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {rule.isActive ? 'Pause' : 'Resume'}
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Delete this automation rule?')) {
                      deleteMutation.mutate(rule.id);
                    }
                  }}
                  style={{ padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
