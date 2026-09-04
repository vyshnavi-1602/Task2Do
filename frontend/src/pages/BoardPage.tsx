import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from '../components/board/Column';
import { IssueCard } from '../components/board/IssueCard';
import { IssueDetailsModal } from '../components/board/IssueDetailsModal';
import { apiClient } from '../lib/apiClient';
import { useProjectSocket } from '../hooks/useProjectSocket';
import { BoardFilters } from '../components/board/BoardFilters';
import { useAuth } from '../context/AuthContext';

export default function BoardPage() {
  const { workspaceId, projectId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const boardId = searchParams.get('boardId');
  const [activeIssue, setActiveIssue] = useState<any | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const { user } = useAuth();

  useProjectSocket(projectId as string);

  // Fetch boards list for project
  const { data: boardsData } = useQuery<any>({
    queryKey: ['boards', projectId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/boards`);
      return data;
    }
  });

  // Fetch board state
  const { data: boardData, isLoading, error } = useQuery<any>({
    queryKey: ['board', projectId, boardId],
    queryFn: async () => {
      const url = boardId 
        ? `/workspaces/${workspaceId}/projects/${projectId}/board?boardId=${boardId}`
        : `/workspaces/${workspaceId}/projects/${projectId}/board`;
      const data = await apiClient.get(url);
      return data;
    }
  });

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Optimistic update mutation
  const updateIssueMutation = useMutation({
    mutationFn: async ({ issueId, status, rank }: { issueId: string; status: string; rank: number }) => {
      return apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`, { status, rank });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['board', projectId] });

      // Snapshot the previous value
      const previousBoard = queryClient.getQueryData(['board', projectId]);

      return { previousBoard };
    },
    onError: (_err, _variables, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', projectId], context.previousBoard);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure backend sync
      queryClient.invalidateQueries({ queryKey: ['board', projectId, boardId] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveIssue(active.data.current?.issue);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIssue(null);
    const { active, over } = event;

    if (!over || !boardData?.columns) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find columns
    const sourceStatus = active.data.current?.issue?.status;
    
    // Find target column and rank
    const targetStatus = over.data.current?.column?.id || over.data.current?.issue?.status;
    
    if (!sourceStatus || !targetStatus) return;

    // Deep clone current board state for optimistic manipulation
    const newColumns = JSON.parse(JSON.stringify(boardData.columns));

    const sourceColIndex = newColumns.findIndex((c: any) => c.id === sourceStatus);
    const destColIndex = newColumns.findIndex((c: any) => c.id === targetStatus);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceList = newColumns[sourceColIndex].issues;
    const destList = newColumns[destColIndex].issues;

    const activeIndex = sourceList.findIndex((i: any) => i.id === activeId);
    let overIndex = destList.findIndex((i: any) => i.id === overId);
    
    if (overIndex === -1 && over.data.current?.type === 'Column') {
      overIndex = destList.length; // Dropped on an empty column area
    }

    // Capture the moved item
    const movedIssue = sourceList[activeIndex];
    movedIssue.statusId = targetStatus; // Optimistically update its status

    // Move logic
    if (sourceStatus === targetStatus) {
      // Same column reorder
      const reorderedList = arrayMove(sourceList, activeIndex, overIndex);
      newColumns[sourceColIndex].issues = reorderedList;
    } else {
      // Different column move
      sourceList.splice(activeIndex, 1);
      destList.splice(overIndex, 0, movedIssue);
    }

    const newRank = destList[overIndex]?.rank || overIndex + 1;

    // Apply optimistic update to query cache
    queryClient.setQueryData(['board', projectId], {
      ...boardData,
      columns: newColumns,
    });

    // Send API Request
    updateIssueMutation.mutate({
      issueId: activeId,
      statusId: targetStatus,
      rank: newRank,
    } as any);
  };

  if (isLoading) return <div>Loading board...</div>;
  if (error) return <div>Error loading board!</div>;

  const { sprint, columns } = boardData || {};

  if (!sprint) {
    return (
      <div className="board-empty-state">
        <h2>No Active Sprint</h2>
        <p>Start a sprint from the backlog to begin working on the board.</p>
      </div>
    );
  }



  const getFilteredIssues = (issues: any[]) => {
    let filtered = issues || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((i) => 
        i.title.toLowerCase().includes(q) || 
        i.key.toLowerCase().includes(q)
      );
    }
    if (onlyMyIssues && user) {
      filtered = filtered.filter((i) => i.assignee?.id === user.id);
    }
    return filtered;
  };

  return (
    <div className="board-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BoardFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onlyMyIssues={onlyMyIssues}
        onOnlyMyIssuesChange={setOnlyMyIssues}
      />
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <select 
          value={boardData?.board?.id || ''} 
          onChange={(e) => setSearchParams(e.target.value ? { boardId: e.target.value } : {})}
          style={{ padding: '4px 8px', borderRadius: '4px' }}
        >
          {boardsData?.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {boardData?.role !== 'VIEWER' && (
          <button 
            className="secondary-button"
            onClick={() => {
              const name = prompt('Enter new board name:');
              if (name) {
                apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/boards`, { name })
                  .then((res: any) => {
                    queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
                    setSearchParams({ boardId: res.id });
                  });
              }
            }}
          >
            Create Board
          </button>
        )}
      </div>
      
      <div className="board-container" style={{ flex: 1, padding: 0, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'inline-flex', height: '100%', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
            {columns?.map((colDef: any) => (
              <div key={colDef.id} style={{ display: 'inline-block', verticalAlign: 'top', height: '100%' }}>
                <Column
                  column={{
                    id: colDef.id,
                    title: colDef.title,
                    issues: getFilteredIssues(colDef.issues),
                  }}
                  onIssueClick={(issueId) => setSelectedIssueId(issueId)}
                  canEdit={boardData?.role !== 'VIEWER'}
                  onRename={(columnId, currentTitle) => {
                    const newTitle = prompt('Enter new column title:', currentTitle);
                    if (newTitle && newTitle !== currentTitle) {
                      apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}/boards/${boardData?.board?.id}/columns/${columnId}`, { title: newTitle })
                        .then(() => queryClient.invalidateQueries({ queryKey: ['board', projectId, boardId] }))
                        .catch(() => alert('Failed to rename column'));
                    }
                  }}
                  onDelete={(columnId) => {
                    if (confirm('Are you sure you want to delete this column? It must be empty.')) {
                      apiClient.delete(`/workspaces/${workspaceId}/projects/${projectId}/boards/${boardData?.board?.id}/columns/${columnId}`)
                        .then(() => queryClient.invalidateQueries({ queryKey: ['board', projectId, boardId] }))
                        .catch((err) => alert(err.response?.data?.error?.message || 'Failed to delete column'));
                    }
                  }}
                />
              </div>
            ))}
            
            {boardData?.role !== 'VIEWER' && (
              <div style={{ display: 'inline-block', verticalAlign: 'top', width: '320px', flexShrink: 0 }}>
                <button 
                  className="secondary-button" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', backgroundColor: 'var(--surface-color)', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}
                  onClick={() => {
                    const title = prompt('Enter column title:');
                    if (title && boardData?.board?.id) {
                      apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/boards/${boardData.board.id}/columns`, { title })
                        .then(() => queryClient.invalidateQueries({ queryKey: ['board', projectId, boardId] }));
                    }
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add Column
                </button>
              </div>
            )}
            
            <DragOverlay>
              {activeIssue ? <IssueCard issue={activeIssue} /> : null}
            </DragOverlay>
          </div>
        </DndContext>
      </div>

      {selectedIssueId && workspaceId && projectId && (
        <IssueDetailsModal
          issueId={selectedIssueId}
          projectId={projectId}
          workspaceId={workspaceId}
          onClose={() => setSelectedIssueId(null)}
          // User role should ideally come from boardData or AuthContext
          userRole={boardData?.role || 'MEMBER'} // Pass derived role
        />
      )}
    </div>
  );
}
