import React from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function ProjectLayout() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const location = useLocation();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}`);
      return data as any;
    },
    enabled: !!workspaceId && !!projectId,
  });

  if (isLoading) {
    return <div style={styles.center}><LoadingSpinner /></div>;
  }

  if (error || !project) {
    return <div style={styles.center}>Project not found or access denied.</div>;
  }

  const isBacklog = location.pathname.includes('/backlog');

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.projectIcon}>{project.key}</div>
          <div>
            <h2 style={styles.projectName}>{project.name}</h2>
            <div style={styles.projectSubtitle}>Software Project</div>
          </div>
        </div>
        
        <nav style={styles.nav}>
          <Link 
            to={`/workspaces/${workspaceId}/projects/${projectId}/backlog`} 
            style={{ ...styles.navLink, ...(isBacklog ? styles.activeNavLink : {}) }}
          >
            Backlog
          </Link>
          {/* Board will be added in Phase 7 */}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <Link to={`/workspaces/${workspaceId}/projects`} style={styles.backLink}>← Back to Projects</Link>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet context={{ project }} />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--surface-color)',
    borderRight: '1px solid var(--border-color)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-6)',
    padding: 'var(--space-2)',
  },
  projectIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.875rem',
  },
  projectName: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
  },
  projectSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  navLink: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'background-color 0.2s, color 0.2s',
  },
  activeNavLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-primary)',
  },
  backLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    padding: 'var(--space-2)',
  },
  main: {
    flex: 1,
    padding: 'var(--space-8)',
    overflowY: 'auto',
    backgroundColor: 'var(--bg-color)',
  },
};
