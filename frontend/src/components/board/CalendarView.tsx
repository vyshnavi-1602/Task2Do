import React, { useState } from 'react';

interface CalendarViewProps {
  boardData: any;
  onIssueClick: (issueId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ boardData, onIssueClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!boardData?.columns) return <div style={{ padding: '24px' }}>Loading calendar...</div>;
  const allIssues = boardData.columns.flatMap((col: any) => col.issues || []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} style={{ padding: '8px', minHeight: '100px', backgroundColor: 'rgba(0,0,0,0.02)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0];
    
    // Find issues that fall on this day (using dueDate or startDate for simplicity)
    const dayIssues = allIssues.filter((issue: any) => {
      if (!issue.dueDate && !issue.startDate) return false;
      const issueDate = issue.dueDate ? new Date(issue.dueDate) : new Date(issue.startDate);
      return issueDate.getFullYear() === year && issueDate.getMonth() === month && issueDate.getDate() === d;
    });

    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

    days.push(
      <div key={d} style={{ 
        padding: '8px', 
        minHeight: '120px', 
        borderRight: '1px solid var(--border-color)', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: isToday ? 'rgba(13, 148, 136, 0.05)' : 'var(--surface-color)',
      }}>
        <div style={{ fontWeight: isToday ? 'bold' : 'normal', color: isToday ? 'var(--primary-color)' : 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
          {d}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {dayIssues.map((issue: any) => (
            <div 
              key={issue.id} 
              onClick={() => onIssueClick(issue.id)}
              style={{ 
                backgroundColor: 'var(--accent-color)', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                fontSize: '11px', 
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={issue.title}
            >
              {issue.key} {issue.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>{monthNames[month]} {year}</h3>
        <div>
          <button className="secondary-button" onClick={prevMonth} style={{ marginRight: '8px', padding: '6px 12px' }}>Previous</button>
          <button className="secondary-button" onClick={() => setCurrentDate(new Date())} style={{ marginRight: '8px', padding: '6px 12px' }}>Today</button>
          <button className="secondary-button" onClick={nextMonth} style={{ padding: '6px 12px' }}>Next</button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        borderTop: '1px solid var(--border-color)', 
        borderLeft: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'var(--surface-color)'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {day}
          </div>
        ))}
        {days}
      </div>
    </div>
  );
};
