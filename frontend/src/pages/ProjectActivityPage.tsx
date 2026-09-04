import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Activity, UserPlus, FileText, Settings, Type } from 'lucide-react';

export default function ProjectActivityPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['project-activity', projectId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/activity`);
      return (data as unknown) as any[];
    },
    enabled: !!workspaceId && !!projectId,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
        Failed to load project activity. Please try again later.
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    const iconStyle = { width: '16px', height: '16px', color: 'var(--text-secondary)' };
    switch (type) {
      case 'STATUS_CHANGE': return <Activity style={iconStyle} />;
      case 'ASSIGNEE_CHANGE': return <UserPlus style={iconStyle} />;
      case 'PRIORITY_CHANGE': return <Activity style={iconStyle} />;
      case 'TITLE_CHANGE': return <Type style={iconStyle} />;
      case 'DESCRIPTION_CHANGE': return <FileText style={iconStyle} />;
      default: return <Settings style={iconStyle} />;
    }
  };

  const formatActivityText = (act: any) => {
    const highlight = (text: string) => (
      <span style={{ 
        fontWeight: 600, 
        color: 'var(--text-primary)',
        backgroundColor: 'var(--bg-color)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.85em',
        border: '1px solid var(--border-color)'
      }}>
        {text}
      </span>
    );

    switch (act.type) {
      case 'STATUS_CHANGE':
        return <span>changed status from {highlight(act.oldValue)} to {highlight(act.newValue)}</span>;
      case 'ASSIGNEE_CHANGE':
        return <span>reassigned from {highlight(act.oldValue || 'Unassigned')} to {highlight(act.newValue || 'Unassigned')}</span>;
      case 'PRIORITY_CHANGE':
        return <span>updated priority from {highlight(act.oldValue)} to {highlight(act.newValue)}</span>;
      case 'SPRINT_CHANGE':
        return <span>moved issue to sprint {highlight(act.newValue)}</span>;
      case 'TITLE_CHANGE':
        return <span>updated the title</span>;
      case 'DESCRIPTION_CHANGE':
        return <span>updated the description</span>;
      case 'POINTS_CHANGE':
        return <span>changed story points from {highlight(act.oldValue || 'None')} to {highlight(act.newValue || 'None')}</span>;
      default:
        return <span>updated the issue</span>;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          Project Activity
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          A timeline of all updates and changes made within this project.
        </p>
      </div>

      {!activities || activities.length === 0 ? (
        <div style={{ 
          padding: '4rem 2rem', 
          textAlign: 'center', 
          backgroundColor: 'var(--surface-color)', 
          borderRadius: '12px',
          border: '1px dashed var(--border-color)'
        }}>
          <Activity style={{ width: '48px', height: '48px', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No activity yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>When team members update issues, their activity will appear here.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
          {/* Vertical Timeline Line */}
          <div style={{
            position: 'absolute',
            left: '27px',
            top: '0',
            bottom: '0',
            width: '2px',
            backgroundColor: 'var(--border-color)',
            zIndex: 0
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activities.map((act) => {
              const timeString = new Date(act.createdAt).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div key={act.id} style={{ 
                  position: 'relative',
                  display: 'flex',
                  gap: '1.5rem',
                  zIndex: 1
                }}>
                  {/* Timeline Avatar/Node */}
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface-color)',
                    border: '2px solid var(--bg-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    boxShadow: '0 0 0 4px var(--bg-color)' // Creates gap effect over line
                  }}>
                    {act.user.avatarUrl ? (
                      <img 
                        src={act.user.avatarUrl} 
                        alt={act.user.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: 'var(--accent-color)', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        {act.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Activity Content Card */}
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: 'var(--surface-color)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{act.user.name}</strong>
                        <span style={{ color: 'var(--text-secondary)' }}>{formatActivityText(act)}</span>
                      </div>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-muted)', 
                        whiteSpace: 'nowrap',
                        marginLeft: '1rem'
                      }}>
                        {timeString}
                      </span>
                    </div>

                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--bg-color)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      marginTop: '0.25rem'
                    }}>
                      {getActivityIcon(act.type)}
                      <span style={{ fontWeight: 600, color: 'var(--accent-color)', fontSize: '0.9rem' }}>
                        {act.issue.key}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {act.issue.title}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
