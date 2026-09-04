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
    <div className="flex items-center -space-x-2">
      {activeUsers.map((user) => (
        <div
          key={user.userId}
          className="relative inline-block h-8 w-8 rounded-full ring-2 ring-background overflow-hidden bg-muted flex-shrink-0"
          title={user.name}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-xs font-medium uppercase">
              {user.name.charAt(0)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
