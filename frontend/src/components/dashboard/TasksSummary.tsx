import React from 'react';
import { User, Clock } from 'lucide-react';

interface Issue {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  project: { id: string, key: string };
}

interface TasksSummaryData {
  myTasks: Issue[];
  inProgressTasks: Issue[];
}

interface TasksSummaryProps {
  tasksSummary: TasksSummaryData;
  onTaskClick: (issueId: string, projectId: string) => void;
}

export const TasksSummary: React.FC<TasksSummaryProps> = ({ tasksSummary, onTaskClick }) => {
  
  const renderIssueList = (title: string, icon: React.ReactNode, issues: Issue[], color: string, bg: string) => (
    <div style={{
      backgroundColor: 'var(--surface-color)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      marginBottom: '24px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ padding: '8px', backgroundColor: bg, color: color, borderRadius: '8px' }}>
          {icon}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{title}</h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', backgroundColor: bg, color: color, borderRadius: '12px' }}>
            {issues.length}
          </span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {issues.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '16px 0' }}>
            No issues found
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {issues.map(issue => (
              <div
                key={issue.id}
                onClick={() => onTaskClick(issue.id, issue.project.id)}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {issue.key}
                  </span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    backgroundColor: issue.status === 'IN_PROGRESS' ? 'rgba(0, 82, 204, 0.1)' : 'rgba(9, 30, 66, 0.04)',
                    color: issue.status === 'IN_PROGRESS' ? 'var(--accent-color)' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {issue.title}
                </h4>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {renderIssueList('My Tasks', <User size={16} />, tasksSummary.myTasks, '#6554c0', 'rgba(101, 84, 192, 0.1)')}
      {renderIssueList('In Progress', <Clock size={16} />, tasksSummary.inProgressTasks, '#ff991f', 'rgba(255, 153, 31, 0.1)')}
    </div>
  );
};
