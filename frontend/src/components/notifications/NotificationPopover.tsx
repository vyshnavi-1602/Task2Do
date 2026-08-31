import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface Notification {
  id: string;
  type: 'ASSIGNED' | 'MENTIONED' | 'COMMENTED';
  message: string;
  isRead: boolean;
  createdAt: string;
  issueId?: string;
  issue?: {
    id: string;
    key: string;
    title: string;
    projectId: string;
    project: { workspaceId: string };
  };
}

export function NotificationPopover({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const res = await apiClient.get(`/notifications?page=${page}&limit=10`);
      return res as unknown as { items: Notification[]; meta: { totalPages: number } };
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.issue) {
      const { projectId, project } = notification.issue;
      const workspaceId = project.workspaceId;
      // Navigate to the board and open the modal
      navigate(`/workspaces/${workspaceId}/projects/${projectId}/board?issueId=${notification.issue.id}`);
      onClose();
    }
  };

  const notifications = data?.items || [];

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: '8px',
      width: '350px',
      backgroundColor: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '480px',
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Notifications</h3>
        <button 
          onClick={() => markAllAsReadMutation.mutate()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-color)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <CheckCircle2 size={14} />
          Mark all as read
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: notification.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.05)',
                cursor: 'pointer',
                display: 'flex',
                gap: '12px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.05)'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: notification.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                  fontWeight: notification.isRead ? 'normal' : '500'
                }}>
                  {notification.message}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-tertiary)', 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {notification.issue && (
                    <span style={{ fontWeight: '500', color: 'var(--primary-color)' }}>
                      {notification.issue.key}
                    </span>
                  )}
                  <span>•</span>
                  <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {!notification.isRead && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-color)',
                  marginTop: '6px'
                }} />
              )}
            </div>
          ))
        )}
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
          >
            Prev
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
            Page {page} of {data.meta.totalPages}
          </span>
          <button 
            disabled={page === data.meta.totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
