import React, { useState } from 'react';

interface TimelineViewProps {
  boardData: any;
  onIssueClick: (issueId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ boardData, onIssueClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!boardData?.columns) return <div style={{ padding: '24px' }}>Loading timeline...</div>;
  const allIssues = boardData.columns.flatMap((col: any) => col.issues || []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Filter issues that overlap with the current month
  const issuesWithDates = allIssues.filter((issue: any) => issue.startDate || issue.dueDate).filter((issue: any) => {
    const start = issue.startDate ? new Date(issue.startDate) : new Date(issue.dueDate);
    const end = issue.dueDate ? new Date(issue.dueDate) : new Date(issue.startDate);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);
    return start <= monthEnd && end >= monthStart;
  });

  return (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', height: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>{monthNames[month]} {year}</h3>
        <div>
          <button className="secondary-button" onClick={prevMonth} style={{ marginRight: '8px', padding: '6px 12px' }}>Previous</button>
          <button className="secondary-button" onClick={() => setCurrentDate(new Date())} style={{ marginRight: '8px', padding: '6px 12px' }}>Today</button>
          <button className="secondary-button" onClick={nextMonth} style={{ padding: '6px 12px' }}>Next</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--surface-color)', overflowX: 'auto' }}>
        {/* Issue List Column */}
        <div style={{ width: '250px', flexShrink: 0, borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', zIndex: 10 }}>
          <div style={{ height: '40px', borderBottom: '1px solid var(--border-color)', padding: '0 12px', display: 'flex', alignItems: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Issues
          </div>
          {issuesWithDates.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>No scheduled issues this month.</div>
          ) : (
            issuesWithDates.map((issue: any) => (
              <div key={`title-${issue.id}`} style={{ height: '40px', borderBottom: '1px solid var(--border-color)', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontWeight: 500, marginRight: '8px', color: 'var(--text-secondary)' }}>{issue.key}</span>
                {issue.title}
              </div>
            ))
          )}
        </div>

        {/* Timeline Grid */}
        <div style={{ flex: 1, minWidth: `${daysInMonth * 40}px`, position: 'relative' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', height: '40px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
            {Array.from({ length: daysInMonth }).map((_, i) => (
              <div key={`header-${i+1}`} style={{ width: '40px', flexShrink: 0, borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* Rows */}
          {issuesWithDates.map((issue: any) => {
            const start = issue.startDate ? new Date(issue.startDate) : new Date(issue.dueDate);
            const end = issue.dueDate ? new Date(issue.dueDate) : new Date(issue.startDate);
            
            // Calculate grid span
            const startDay = start.getFullYear() === year && start.getMonth() === month ? start.getDate() : 1;
            const endDay = end.getFullYear() === year && end.getMonth() === month ? end.getDate() : daysInMonth;
            
            const leftOffset = (startDay - 1) * 40;
            const width = (endDay - startDay + 1) * 40;

            return (
              <div key={`row-${issue.id}`} style={{ display: 'flex', height: '40px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <div key={`cell-${i+1}`} style={{ width: '40px', flexShrink: 0, borderRight: '1px solid var(--border-color)' }}></div>
                ))}
                
                {/* Gantt Bar */}
                <div 
                  onClick={() => onIssueClick(issue.id)}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    left: `${leftOffset + 4}px`,
                    width: `${width - 8}px`,
                    height: '28px',
                    backgroundColor: 'var(--primary-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    color: 'white',
                    fontSize: '12px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  title={`${issue.title} (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`}
                >
                  {issue.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
