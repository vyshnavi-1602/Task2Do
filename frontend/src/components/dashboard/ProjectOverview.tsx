import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, LayoutList } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  key: string;
  totalIssues: number;
  completedIssues: number;
  remainingIssues: number;
  progress: number;
}

interface ProjectOverviewProps {
  projects: Project[];
  workspaceId: string;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects, workspaceId }) => {
  return (
    <div style={{
      backgroundColor: 'var(--surface-color)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Project Overview</h2>
        <Link 
          to={`/workspaces/${workspaceId}/projects`} 
          style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          View all →
        </Link>
      </div>

      <div style={{ padding: '0' }}>
        {projects.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              <Folder size={32} />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>No projects found in this workspace.</p>
          </div>
        ) : (
          <div>
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/workspaces/${workspaceId}/projects/${project.id}/board`}
                style={{ 
                  display: 'block', 
                  padding: '20px 24px', 
                  borderBottom: '1px solid var(--border-color)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {project.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <LayoutList size={14} /> {project.key}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {project.progress}%
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${project.progress}%`, 
                      backgroundColor: 'var(--accent-color)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{project.totalIssues}</span> issues ·{' '}
                  <span style={{ color: '#00875a' }}>{project.completedIssues} completed</span> ·{' '}
                  <span>{project.remainingIssues} remaining</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
