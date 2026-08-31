import React from 'react';
import { Folder, CheckCircle, User, Clock } from 'lucide-react';

interface Stats {
  totalProjects: number;
  completedIssues: number;
  myTasks: number;
  inProgressIssues: number;
}

interface StatsGridProps {
  stats: Stats;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const statCards = [
    {
      icon: Folder,
      title: 'Total Projects',
      value: stats.totalProjects,
      color: 'var(--accent-color)',
      bg: 'rgba(0, 82, 204, 0.1)',
    },
    {
      icon: CheckCircle,
      title: 'Completed',
      value: stats.completedIssues,
      color: '#00875a',
      bg: 'rgba(0, 135, 90, 0.1)',
    },
    {
      icon: User,
      title: 'My Tasks',
      value: stats.myTasks,
      color: '#6554c0',
      bg: 'rgba(101, 84, 192, 0.1)',
    },
    {
      icon: Clock,
      title: 'In Progress',
      value: stats.inProgressIssues,
      color: '#ff991f',
      bg: 'rgba(255, 153, 31, 0.1)',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
      {statCards.map((card, i) => (
        <div key={i} style={{ 
          backgroundColor: 'var(--surface-color)', 
          padding: '24px', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px' }}>
              {card.title}
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 600 }}>
              {card.value}
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: 'var(--radius-md)', 
            backgroundColor: card.bg, 
            color: card.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <card.icon size={24} />
          </div>
        </div>
      ))}
    </div>
  );
};
