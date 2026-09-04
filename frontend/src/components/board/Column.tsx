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
  onRename?: (columnId: string, currentTitle: string) => void;
  onDelete?: (columnId: string) => void;
  canEdit?: boolean;
}

export function Column({ column, onIssueClick, onRename, onDelete, canEdit }: ColumnProps) {
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <h3 style={{ margin: 0 }}>{column.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="issue-count">{column.issues.length}</span>
            {canEdit && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => onRename?.(column.id, column.title)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-secondary)' }}
                  title="Rename Column"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button 
                  onClick={() => onDelete?.(column.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--danger-color)' }}
                  title="Delete Column"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            )}
          </div>
        </div>
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
