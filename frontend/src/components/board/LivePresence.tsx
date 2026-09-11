import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useParams } from 'react-router-dom';

interface ActiveUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  socketId: string;
}

export const LivePresence: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { projectId } = useParams<{ projectId: string }>();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    if (!socket || !isConnected || !projectId) return;

    socket.emit('joinProjectRoom', projectId);

    socket.on('presence:update', (users: ActiveUser[]) => {
      setActiveUsers(users);
    });

    return () => {
      socket.emit('leaveProjectRoom', projectId);
      socket.off('presence:update');
    };
  }, [socket, isConnected, projectId]);

  if (activeUsers.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '-8px' }}>
      {activeUsers.map((user) => (
        <div
          key={user.userId}
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: 'var(--accent-color)',
            flexShrink: 0,
            border: '2px solid var(--surface-color)',
            marginLeft: '-8px'
          }}
          title={user.name}
        >
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              style={{ height: '100%', width: '100%', objectFit: 'cover' }} 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--text-secondary)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'uppercase'
            }}>
              {user.name.charAt(0)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
