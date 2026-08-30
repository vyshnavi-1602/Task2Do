import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { apiClient } from '../lib/apiClient';

export default function BoardPage() {
  const { workspaceId, projectId } = useParams();
  const queryClient = useQueryClient();
  const [activeIssue, setActiveIssue] = useState<any | null>(null);

  // Fetch board state
  const { data: boardData, isLoading, error } = useQuery<any>({
    queryKey: ['board', projectId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/board`);
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
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
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

    const sourceList = newColumns[sourceStatus];
    const destList = newColumns[targetStatus];

    const activeIndex = sourceList.findIndex((i: any) => i.id === activeId);
    let overIndex = destList.findIndex((i: any) => i.id === overId);
    
    if (overIndex === -1 && over.data.current?.type === 'Column') {
      overIndex = destList.length; // Dropped on an empty column area
    }

    // Capture the moved item
    const movedIssue = sourceList[activeIndex];
    movedIssue.status = targetStatus; // Optimistically update its status

    // Move logic
    if (sourceStatus === targetStatus) {
      // Same column reorder
      const reorderedList = arrayMove(sourceList, activeIndex, overIndex);
      newColumns[sourceStatus] = reorderedList;
    } else {
      // Different column move
      sourceList.splice(activeIndex, 1);
      destList.splice(overIndex, 0, movedIssue);
    }

    // Determine new rank mathematically to send to backend
    // The backend wants the absolute array index `overIndex` (or we can just send the index)
    // Wait, the backend logic: `newRank` is used to figure out shifting.
    // If we just pass the `overIndex` + 1 (since 1-indexed ranks might be easier, but let's just pass `overIndex`)
    // Actually, backend uses `rank` directly as a 1-based or whatever value. Let's send the exact `overIndex` position
    // Or rather, we should send the rank of the item we dropped onto.
    const newRank = destList[overIndex]?.rank || overIndex + 1;

    // Apply optimistic update to query cache
    queryClient.setQueryData(['board', projectId], {
      ...boardData,
      columns: newColumns,
    });

    // Send API Request
    updateIssueMutation.mutate({
      issueId: activeId,
      status: targetStatus,
      rank: newRank,
    });
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

  const columnDefinitions = [
    { id: 'TO_DO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' },
  ];

  return (
    <div className="board-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {columnDefinitions.map((colDef) => (
          <Column
            key={colDef.id}
            column={{
              id: colDef.id,
              title: colDef.title,
              issues: columns[colDef.id] || [],
            }}
          />
        ))}
        
        <DragOverlay>
          {activeIssue ? <IssueCard issue={activeIssue} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
