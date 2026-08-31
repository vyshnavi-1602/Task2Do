import { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { IssueCard } from './IssueCard';

interface ColumnProps {
  column: {
    id: string; // e.g. "TO_DO", "IN_PROGRESS", "DONE"
    title: string;
    issues: any[];
  };
  onIssueClick?: (issueId: string) => void;
}

export function Column({ column, onIssueClick }: ColumnProps) {
  const issueIds = useMemo(() => column.issues.map((i) => i.id), [column.issues]);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div className="board-column">
      <div className="board-column-header">
        <h3>{column.title}</h3>
        <span className="issue-count">{column.issues.length}</span>
      </div>
      
      <div className="board-column-body" ref={setNodeRef}>
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {column.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={onIssueClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
