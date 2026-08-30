import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function BacklogPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const queryClient = useQueryClient();

  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newSprintName, setNewSprintName] = useState('');

  // Queries
  const { data: sprints, isLoading: sprintsLoading } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/sprints`);
      return data as unknown as any[];
    },
  });

  const { data: backlogIssues, isLoading: backlogLoading } = useQuery({
    queryKey: ['issues', 'backlog', projectId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/issues?backlog=true`);
      return data as unknown as any[];
    },
  });

  // Mutations
  const createSprint = useMutation({
    mutationFn: async (name: string) => {
      await apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/sprints`, { name });
    },
    onSuccess: () => {
      setNewSprintName('');
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });

  const createIssue = useMutation({
    mutationFn: async (title: string) => {
      await apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/issues`, { title });
    },
    onSuccess: () => {
      setNewIssueTitle('');
      queryClient.invalidateQueries({ queryKey: ['issues', 'backlog', projectId] });
    },
  });

  const updateIssueSprint = useMutation({
    mutationFn: async ({ issueId, sprintId }: { issueId: string; sprintId: string | null }) => {
      await apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`, { sprintId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'backlog', projectId] });
    },
  });

  const startSprint = useMutation({
    mutationFn: async (sprintId: string) => {
      await apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}/sprints/${sprintId}`, { status: 'ACTIVE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });

  if (sprintsLoading || backlogLoading) return <div style={{ padding: '2rem' }}><LoadingSpinner /></div>;

  const renderIssue = (issue: any) => (
    <div key={issue.id} style={styles.issueRow}>
      <div style={styles.issueKey}>{issue.key}</div>
      <div style={styles.issueTitle}>{issue.title}</div>
      <div style={styles.issueMeta}>
        <span style={styles.badge}>{issue.status}</span>
        <select 
          value={issue.sprintId || ''} 
          onChange={(e) => updateIssueSprint.mutate({ issueId: issue.id, sprintId: e.target.value || null })}
          style={styles.sprintSelect}
        >
          <option value="">Backlog</option>
          {sprints?.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Backlog</h1>
        <div style={styles.createSprintForm}>
          <input 
            type="text" 
            placeholder="Sprint Name"
            value={newSprintName}
            onChange={(e) => setNewSprintName(e.target.value)}
            style={styles.input}
          />
          <button 
            onClick={() => newSprintName && createSprint.mutate(newSprintName)}
            style={styles.secondaryButton}
            disabled={createSprint.isPending}
          >
            Create Sprint
          </button>
        </div>
      </header>

      {/* SPRINTS */}
      <div style={styles.sprintsContainer}>
        {sprints?.map(sprint => (
          <div key={sprint.id} style={styles.sprintBlock}>
            <div style={styles.sprintHeader}>
              <h3 style={styles.sprintName}>{sprint.name} <span style={styles.statusBadge(sprint.status)}>{sprint.status}</span></h3>
              {sprint.status === 'PLANNED' && (
                <button 
                  style={styles.primaryButton} 
                  onClick={() => startSprint.mutate(sprint.id)}
                  disabled={startSprint.isPending}
                >
                  Start Sprint
                </button>
              )}
            </div>
            
            <div style={styles.issueList}>
              {sprint.issues?.length === 0 ? (
                <div style={styles.emptyText}>Plan a sprint by moving issues here.</div>
              ) : (
                sprint.issues?.map((issue: any) => renderIssue(issue))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* BACKLOG */}
      <div style={styles.sprintBlock}>
        <div style={styles.sprintHeader}>
          <h3 style={styles.sprintName}>Backlog</h3>
        </div>
        <div style={styles.issueList}>
          {backlogIssues?.map(issue => renderIssue(issue))}
          
          <div style={styles.createIssueRow}>
            <input 
              type="text" 
              placeholder="What needs to be done?"
              value={newIssueTitle}
              onChange={(e) => setNewIssueTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newIssueTitle) {
                  createIssue.mutate(newIssueTitle);
                }
              }}
              style={styles.transparentInput}
            />
            <button 
              onClick={() => newIssueTitle && createIssue.mutate(newIssueTitle)}
              style={styles.secondaryButton}
              disabled={createIssue.isPending || !newIssueTitle}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-6)',
  },
  createSprintForm: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  sprintsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
    marginBottom: 'var(--space-8)',
  },
  sprintBlock: {
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  sprintHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-3) var(--space-4)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid var(--border-color)',
  },
  sprintName: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  statusBadge: (status: string) => ({
    fontSize: '0.75rem',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: 500,
    backgroundColor: status === 'ACTIVE' ? 'rgba(46, 160, 67, 0.2)' : 'rgba(139, 148, 158, 0.2)',
    color: status === 'ACTIVE' ? '#3fb950' : 'var(--text-secondary)',
  }),
  issueList: {
    display: 'flex',
    flexDirection: 'column',
  },
  issueRow: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--border-color)',
    gap: 'var(--space-4)',
    transition: 'background-color 0.2s',
  },
  issueKey: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    width: '80px',
  },
  issueTitle: {
    flex: 1,
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
  },
  issueMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  sprintSelect: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
  },
  createIssueRow: {
    display: 'flex',
    padding: 'var(--space-2) var(--space-4)',
    gap: 'var(--space-4)',
  },
  transparentInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  emptyText: {
    padding: 'var(--space-4)',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    fontSize: '0.875rem',
    fontStyle: 'italic',
  },
  input: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
  },
  primaryButton: {
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    fontSize: '0.875rem',
  }
};
