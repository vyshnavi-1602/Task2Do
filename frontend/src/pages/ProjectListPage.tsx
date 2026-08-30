import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface Project {
  id: string;
  name: string;
  key: string;
  _count?: { issues: number };
}

export default function ProjectListPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/projects`);
      return data as unknown as Project[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newProject: { name: string; key: string }) => {
      const data = await apiClient.post(`/workspaces/${workspaceId}/projects`, newProject);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      setIsCreating(false);
      setName('');
      setKey('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    createMutation.mutate({ name, key: key.toUpperCase() });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>Projects</h1>
        <button 
          style={styles.primaryButton}
          onClick={() => setIsCreating(true)}
        >
          Create Project
        </button>
      </header>

      {error && <div style={styles.error}>Failed to load projects.</div>}
      {createMutation.isError && (
        <div style={styles.errorAlert}>{(createMutation.error as any)?.response?.data?.error?.message || 'Failed to create project.'}</div>
      )}

      {isCreating && (
        <form onSubmit={handleSubmit} style={styles.createForm}>
          <div style={styles.formRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Project Name</label>
              <input
                type="text"
                placeholder="e.g., Frontend Overhaul"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Key</label>
              <input
                type="text"
                placeholder="e.g., FEO"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                style={{ ...styles.input, textTransform: 'uppercase' }}
                maxLength={10}
                required
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button type="button" onClick={() => setIsCreating(false)} style={styles.secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} style={styles.primaryButton}>
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Key</th>
              <th style={styles.th}>Issues</th>
            </tr>
          </thead>
          <tbody>
            {projects?.map((project) => (
              <tr 
                key={project.id} 
                style={{ ...styles.tr, cursor: 'pointer' }}
                onClick={() => navigate(`/workspaces/${workspaceId}/projects/${project.id}`)}
              >
                <td style={styles.td}><strong>{project.name}</strong></td>
                <td style={styles.td}><span style={styles.badge}>{project.key}</span></td>
                <td style={styles.td}>{project._count?.issues || 0}</td>
              </tr>
            ))}
            {projects?.length === 0 && !isCreating && (
              <tr>
                <td colSpan={3} style={styles.emptyState}>No projects created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-6)',
  },
  title: {
    fontSize: '1.5rem',
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
  createForm: {
    backgroundColor: 'var(--surface-color)',
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    marginBottom: 'var(--space-8)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  formRow: {
    display: 'flex',
    gap: 'var(--space-4)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    flex: 1,
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
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
  tableContainer: {
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: 'var(--space-3) var(--space-4)',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-8)',
    color: 'var(--text-secondary)',
  },
  error: {
    color: 'var(--error-color)',
    marginBottom: 'var(--space-4)',
  },
  errorAlert: {
    padding: 'var(--space-3)',
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    color: 'var(--error-color)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--error-color)',
    marginBottom: 'var(--space-4)',
  },
};
