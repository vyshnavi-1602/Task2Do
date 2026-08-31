import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { socket } from '../lib/socketClient';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ActiveSprintCard } from '../components/dashboard/ActiveSprintCard';
import { ProjectOverview } from '../components/dashboard/ProjectOverview';
import { TasksSummary } from '../components/dashboard/TasksSummary';
import { IssueDetailsModal } from '../components/board/IssueDetailsModal';

export default function WorkspaceDashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIssue, setSelectedIssue] = useState<{ id: string, projectId: string } | null>(null);

  const { data: dashboardRes, isLoading, error } = useQuery({
    queryKey: ['workspace-dashboard', workspaceId],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/dashboard`);
      return res as any; // apiClient already unwraps response.data.data
    },
    enabled: !!workspaceId,
  });

  // Setup Socket.io for Real-time Updates
  useEffect(() => {
    if (!workspaceId) return;

    const handleInvalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-dashboard', workspaceId] });
    };

    socket.on('issue:created', handleInvalidate);
    socket.on('issue:updated', handleInvalidate);
    socket.on('issue:deleted', handleInvalidate);
    socket.on('sprint:created', handleInvalidate);
    socket.on('sprint:updated', handleInvalidate);

    return () => {
      socket.off('issue:created', handleInvalidate);
      socket.off('issue:updated', handleInvalidate);
      socket.off('issue:deleted', handleInvalidate);
      socket.off('sprint:created', handleInvalidate);
      socket.off('sprint:updated', handleInvalidate);
    };
  }, [workspaceId, queryClient]);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}><LoadingSpinner /></div>;
  }

  if (error || !dashboardRes) {
    return <div>Error loading dashboard.</div>;
  }

  const { stats, activeSprint, projectOverview, tasksSummary } = dashboardRes;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 40px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Welcome back, {user?.name || 'User'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Here's what's happening across your workspace today.
        </p>
      </div>

      <StatsGrid stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {activeSprint && (
            <ActiveSprintCard sprint={activeSprint} workspaceId={workspaceId!} />
          )}
          <ProjectOverview projects={projectOverview} workspaceId={workspaceId!} />
        </div>
        
        <div>
          <TasksSummary 
            tasksSummary={tasksSummary} 
            onTaskClick={(issueId: string, projectId: string) => setSelectedIssue({ id: issueId, projectId })} 
          />
        </div>
      </div>

      {selectedIssue && (
        <IssueDetailsModal
          issueId={selectedIssue.id}
          projectId={selectedIssue.projectId}
          workspaceId={workspaceId!}
          onClose={() => setSelectedIssue(null)}
          userRole="MEMBER"
        />
      )}
    </div>
  );
}
// trigger reload
