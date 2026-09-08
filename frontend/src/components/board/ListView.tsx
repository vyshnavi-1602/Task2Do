import React from 'react';

interface ListViewProps {
  boardData: any;
  workspaceId: string;
  projectId: string;
  onIssueClick: (issueId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({ boardData, onIssueClick }) => {
  if (!boardData?.columns) return <div style={{ padding: '24px' }}>Loading list...</div>;

  const allIssues = boardData.columns.flatMap((col: any) => col.issues || []);

  return (
    <div style={{ padding: '0 24px 24px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: 'var(--surface-color)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Key</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Title</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Assignee</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {allIssues.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No issues found.</td>
            </tr>
          ) : (
            allIssues.map((issue: any) => (
              <tr 
                key={issue.id} 
                style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => onIssueClick(issue.id)}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-secondary)' }}>{issue.key}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{issue.title}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ebecf0', color: '#42526e' }}>
                    {issue.status?.title || 'Unknown'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {issue.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {issue.assignee.avatarUrl ? (
                        <img src={issue.assignee.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#0052cc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
                          {issue.assignee.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{issue.assignee.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Unassigned</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {issue.priority.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
