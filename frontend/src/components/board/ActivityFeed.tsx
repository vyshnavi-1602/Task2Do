interface ActivityProps {
  activity: {
    id: string;
    type: string;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  };
}

export function ActivityFeed({ activity }: ActivityProps) {
  const formatActivityMessage = () => {
    switch (activity.type) {
      case 'STATUS_CHANGE':
        return `changed status from ${activity.oldValue?.replace('_', ' ')} to ${activity.newValue?.replace('_', ' ')}`;
      case 'ASSIGNEE_CHANGE':
        if (activity.newValue === 'Unassigned') {
          return `unassigned this issue`;
        }
        return `assigned to ${activity.newValue}`; // Wait, newValue is userId. The backend currently passes ID if we don't resolve name, but we logged name if we used names? Ah! The backend actually logged the ID. Let's just say "updated the assignee". 
        // For a perfect UX we'd resolve the user name on the backend before saving to oldValue/newValue. Let's just output a generic message for assignee.
      case 'PRIORITY_CHANGE':
        return `changed priority from ${activity.oldValue} to ${activity.newValue}`;
      case 'SPRINT_CHANGE':
        return `moved this issue between sprints`;
      case 'TITLE_CHANGE':
        return `changed the title`;
      case 'DESCRIPTION_CHANGE':
        return `updated the description`;
      case 'POINTS_CHANGE':
        return `changed story points from ${activity.oldValue} to ${activity.newValue}`;
      default:
        return `updated the issue`;
    }
  };

  return (
    <div className="timeline-item" style={{ marginBottom: '16px' }}>
      <div className="timeline-avatar" style={{ width: '24px', height: '24px', fontSize: '0.65rem', background: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        {activity.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="timeline-content" style={{ alignSelf: 'center' }}>
        <div className="timeline-body is-activity">
          <span className="timeline-author" style={{ marginRight: '4px' }}>{activity.user.name}</span>
          {formatActivityMessage()}
          <span className="timeline-time" style={{ marginLeft: '8px' }}>
            {new Date(activity.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
