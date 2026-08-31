import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

interface ActiveSprint {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  projectKey: string;
  totalIssues: number;
  completedIssues: number;
  progress: number;
}

interface ActiveSprintCardProps {
  sprint: ActiveSprint;
  workspaceId: string;
}

export const ActiveSprintCard: React.FC<ActiveSprintCardProps> = ({ sprint, workspaceId }) => {
  return (
    <div style={{
      backgroundColor: 'var(--surface-color)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', backgroundColor: 'rgba(0, 82, 204, 0.1)', color: 'var(--accent-color)', borderRadius: '4px' }}>
            <Activity size={18} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Sprint</h2>
        </div>
        <Link 
          to={`/workspaces/${workspaceId}/projects/${sprint.projectId}/board`}
          style={{ fontSize: '0.875rem', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 500 }}
        >
          View Board →
        </Link>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {sprint.name}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {sprint.projectName} ({sprint.projectKey})
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{sprint.totalIssues}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Issues</div>
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#00875a' }}>{sprint.completedIssues}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Sprint Progress</span>
          <span style={{ fontWeight: 500 }}>{sprint.progress}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${sprint.progress}%`, 
            backgroundColor: 'var(--accent-color)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
};
