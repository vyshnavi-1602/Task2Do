import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface IssueCardProps {
  issue: {
    id: string;
    key: string;
    title: string;
    priority: string;
    type: string;
    assignee?: { id: string; name: string; avatarUrl?: string | null };
  };
  onClick?: (issueId: string) => void;
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
    data: {
      type: 'Issue',
      issue,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW': return '🔽';
      case 'HIGH': return '🔼';
      case 'URGENT': return '⏫';
      case 'MEDIUM':
      default: return '⏸️';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG': return '🔴';
      case 'STORY': return '🟩';
      case 'EPIC': return '🟪';
      case 'SUB_TASK': return '🟦';
      case 'TASK':
      default: return '☑️';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="issue-card"
      onClick={() => {
        // Only trigger click if we aren't dragging. dnd-kit usually prevents onClick if dragging, but we can be safe.
        if (onClick && !isDragging) {
          onClick(issue.id);
        }
      }}
    >
      <div className="issue-card-content">
        <p className="issue-title">{issue.title}</p>
        <div className="issue-meta">
          <div className="issue-meta-left">
            <span className="issue-type" title={issue.type} style={{ fontSize: '14px', marginRight: '4px' }}>
              {getTypeIcon(issue.type)}
            </span>
            <span className="issue-priority" title={issue.priority} style={{ fontSize: '14px', marginRight: '4px' }}>
              {getPriorityIcon(issue.priority)}
            </span>
            <span className="issue-key" style={{ fontSize: '12px', color: '#5e6c84' }}>{issue.key}</span>
          </div>
          {issue.assignee && (
            <div className="issue-assignee-avatar" title={issue.assignee.name}>
              {issue.assignee.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
