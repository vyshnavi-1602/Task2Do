import React from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export default function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();

  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}`);
      return data as any;
    },
    enabled: !!workspaceId,
  });

  const { user } = useAuth();
  const { data: members } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/members`);
      return data as unknown as any[];
    },
    enabled: !!workspaceId,
  });

  const myMemberInfo = members?.find((m: any) => m.user.id === user?.id);
  const isAdmin = myMemberInfo?.role === 'ADMIN';

  if (isLoading) {
    return <div style={styles.center}><LoadingSpinner /></div>;
  }

  if (error || !workspace) {
    return <div style={styles.center}>Workspace not found or access denied.</div>;
  }

  const isDashboard = location.pathname.includes('/dashboard');
  const isProjects = location.pathname.includes('/projects');
  const isMembers = location.pathname.includes('/members');

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.workspaceIcon}>{workspace.name.charAt(0).toUpperCase()}</div>
          <h2 style={styles.workspaceName}>{workspace.name}</h2>
        </div>
        
        <nav style={styles.nav}>
          <Link 
            to={`/workspaces/${workspaceId}/dashboard`} 
            style={{ ...styles.navLink, ...(isDashboard ? styles.activeNavLink : {}) }}
          >
            Dashboard
          </Link>
          <Link 
            to={`/workspaces/${workspaceId}/projects`} 
            style={{ ...styles.navLink, ...(isProjects ? styles.activeNavLink : {}) }}
          >
            Projects
          </Link>
          <Link 
            to={`/workspaces/${workspaceId}/members`} 
            style={{ ...styles.navLink, ...(isMembers ? styles.activeNavLink : {}) }}
          >
            Members
          </Link>
          {isAdmin && (
            <Link 
              to={`/workspaces/${workspaceId}/settings`} 
              style={{ ...styles.navLink, ...(location.pathname.includes('/settings') ? styles.activeNavLink : {}) }}
            >
              Settings
            </Link>
          )}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <Link to="/" style={styles.backLink}>← Back to Dashboard</Link>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
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
  workspaceIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  workspaceName: {
    fontSize: '1rem',
    fontWeight: 600,
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
  },
};
