import React from 'react';

interface TimelineViewProps {
  boardData: any;
  onIssueClick: (issueId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ boardData }) => {
  return (
    <div style={{ padding: '0 24px 24px', color: 'var(--text-secondary)' }}>
      <div style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
        <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Timeline / Gantt View</h3>
        <p>This view is under construction. It will display issues on a horizontal timeline (Gantt chart).</p>
      </div>
    </div>
  );
};
