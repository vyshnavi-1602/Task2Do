import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface Workspace {
  id: string;
  name: string;
  _count?: { projects: number; members: number };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const data = await apiClient.get('/workspaces');
      return data as unknown as Workspace[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const data = await apiClient.post('/workspaces', { name });
      return data as unknown as Workspace;
    },
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setIsCreating(false);
      setNewWorkspaceName('');
      navigate(`/workspaces/${newWorkspace.id}/projects`);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createMutation.mutate(newWorkspaceName);
  };

  if (isLoading) {
    return (
      <div style={styles.center}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Welcome back, {user?.name}</h1>
        <button 
          style={styles.primaryButton}
          onClick={() => setIsCreating(true)}
        >
          Create Workspace
        </button>
      </header>

      {error && <div style={styles.error}>Failed to load workspaces.</div>}

      {isCreating && (
        <form onSubmit={handleCreate} style={styles.createForm}>
          <input
            type="text"
            placeholder="Workspace Name (e.g., Acme Corp)"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            style={styles.input}
            autoFocus
            required
          />
          <div style={styles.formActions}>
            <button type="button" onClick={() => setIsCreating(false)} style={styles.secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} style={styles.primaryButton}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.grid}>
        {workspaces?.map((workspace) => (
          <div 
            key={workspace.id} 
            style={styles.card}
            onClick={() => navigate(`/workspaces/${workspace.id}/projects`)}
          >
            <h3 style={styles.cardTitle}>{workspace.name}</h3>
            <div style={styles.cardMeta}>
              <span>{workspace._count?.projects || 0} Projects</span>
              <span>•</span>
              <span>{workspace._count?.members || 0} Members</span>
            </div>
          </div>
        ))}

        {workspaces?.length === 0 && !isCreating && (
          <div style={styles.emptyState}>
            <p>You don't belong to any workspaces yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'var(--space-8)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-8)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
  },
  primaryButton: {
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 'var(--space-6)',
  },
  card: {
    backgroundColor: 'var(--surface-color)',
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: 'var(--space-2)',
  },
  cardMeta: {
    display: 'flex',
    gap: 'var(--space-2)',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
  },
  createForm: {
    backgroundColor: 'var(--surface-color)',
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    marginBottom: 'var(--space-8)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    maxWidth: '500px',
  },
  input: {
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  },
  formActions: {
    display: 'flex',
    gap: 'var(--space-2)',
    justifyContent: 'flex-end',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: 'var(--space-8)',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--border-color)',
  },
  error: {
    color: 'var(--error-color)',
    marginBottom: 'var(--space-4)',
  }
};
