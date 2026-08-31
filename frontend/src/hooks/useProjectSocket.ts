import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../lib/socketClient';

export const useProjectSocket = (projectId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    // Join the project room
    socket.emit('joinProjectRoom', projectId);

    const handleIssueEvent = () => {
      // Invalidate the issues query to trigger a background refetch
      // The query key for issues is usually ['issues', projectId, ...]
      queryClient.invalidateQueries({
        queryKey: ['issues', projectId]
      });
      queryClient.invalidateQueries({
        queryKey: ['board', projectId]
      });
    };

    socket.on('issue:created', handleIssueEvent);
    socket.on('issue:updated', handleIssueEvent);
    socket.on('issue:moved', handleIssueEvent);
    socket.on('issue:deleted', handleIssueEvent);

    return () => {
      socket.emit('leaveProjectRoom', projectId);
      socket.off('issue:created', handleIssueEvent);
      socket.off('issue:updated', handleIssueEvent);
      socket.off('issue:moved', handleIssueEvent);
      socket.off('issue:deleted', handleIssueEvent);
    };
  }, [projectId, queryClient]);
};
