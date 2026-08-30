import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface IssueCardProps {
  issue: {
    id: string;
    key: string;
    title: string;
    priority: string;
    assignee?: { id: string; name: string; avatarUrl?: string | null };
  };
}

export function IssueCard({ issue }: IssueCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="issue-card"
    >
      <div className="issue-card-content">
        <p className="issue-title">{issue.title}</p>
        <div className="issue-meta">
          <div className="issue-meta-left">
            <span className="issue-key">{issue.key}</span>
            <span className="issue-priority" title={issue.priority}>
              {getPriorityIcon(issue.priority)}
            </span>
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
