import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}`);
      return data as any;
    },
    enabled: !!workspaceId,
  });

  const { data: members } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/members`);
      return (data as unknown) as any[];
    },
    enabled: !!workspaceId,
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/workspaces/${workspaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      navigate('/dashboard');
    },
    onError: (err: Error) => {
      setDeleteError(err.message || 'Failed to delete workspace');
      setIsDeleting(false);
    }
  });

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirmation !== workspace?.name) {
      setDeleteError('Confirmation name does not match');
      return;
    }
    setIsDeleting(true);
    deleteWorkspaceMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const myMemberInfo = members?.find((m) => m.user.id === user?.id);
  const isAdmin = myMemberInfo?.role === 'ADMIN';

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-6)' }}>Workspace Settings</h1>

      {!isAdmin ? (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to modify settings for this workspace. Only Admins can perform these actions.</p>
        </div>
      ) : (
        <div style={{ 
          padding: 'var(--space-6)', 
          backgroundColor: 'var(--surface-color)', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--danger-color)',
          marginTop: 'var(--space-8)'
        }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--danger-color)', marginBottom: 'var(--space-2)' }}>Danger Zone</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Deleting a workspace will permanently delete all of its projects, sprints, issues, and comments. This action cannot be undone.
          </p>

          <form onSubmit={handleDelete}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.875rem' }}>
                Please type <strong style={{ color: 'var(--text-primary)' }}>{workspace?.name}</strong> to confirm.
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                placeholder={workspace?.name}
              />
            </div>

            {deleteError && (
              <div style={{ color: 'var(--danger-color)', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
                {deleteError}
              </div>
            )}

            <button
              type="submit"
              disabled={isDeleting || deleteConfirmation !== workspace?.name}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--danger-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                cursor: (isDeleting || deleteConfirmation !== workspace?.name) ? 'not-allowed' : 'pointer',
                opacity: (isDeleting || deleteConfirmation !== workspace?.name) ? 0.5 : 1,
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Workspace'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
