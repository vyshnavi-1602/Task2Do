import React, { useState, useEffect } from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { LivePresence } from '../components/board/LivePresence';
import { useSocket } from '../context/SocketContext';

export default function ProjectLayout() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected || !projectId) return;

    const invalidateIssues = () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    };

    socket.on('issue:created', invalidateIssues);
    socket.on('issue:updated', invalidateIssues);
    socket.on('issue:deleted', invalidateIssues);

    return () => {
      socket.off('issue:created', invalidateIssues);
      socket.off('issue:updated', invalidateIssues);
      socket.off('issue:deleted', invalidateIssues);
    };
  }, [socket, isConnected, projectId, queryClient]);


  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}`);
      return data as any;
    },
    enabled: !!workspaceId && !!projectId,
  });

  const isBacklog = location.pathname.includes('/backlog');
  const isBoard = location.pathname.includes('/board');
  const currentStyles = getStyles(isMobile, isSidebarOpen, isBoard);

  if (isLoading) {
    return <div style={currentStyles.center}><LoadingSpinner /></div>;
  }

  if (error || !project) {
    return <div style={currentStyles.center}>Project not found or access denied.</div>;
  }

  return (
    <div style={currentStyles.container}>
      {isMobile && (
        <button onClick={toggleSidebar} style={currentStyles.mobileMenuBtn}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div style={currentStyles.overlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside style={currentStyles.sidebar}>
        <div style={currentStyles.sidebarHeader}>
          <div style={currentStyles.projectIcon}>{project.key}</div>
          <div>
            <h2 style={currentStyles.projectName}>{project.name}</h2>
            <div style={currentStyles.projectSubtitle}>Software Project</div>
          </div>
        </div>
        
        <nav style={currentStyles.nav}>
          <Link 
            to={`/workspaces/${workspaceId}/projects/${projectId}/backlog`} 
            style={{ ...currentStyles.navLink, ...(isBacklog ? currentStyles.activeNavLink : {}) }}
            onClick={() => isMobile && setIsSidebarOpen(false)}
          >
            Backlog
          </Link>
          <Link 
            to={`/workspaces/${workspaceId}/projects/${projectId}/board`} 
            style={{ ...currentStyles.navLink, ...(isBoard ? currentStyles.activeNavLink : {}) }}
            onClick={() => isMobile && setIsSidebarOpen(false)}
          >
            Board
          </Link>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <Link to={`/workspaces/${workspaceId}/projects`} style={currentStyles.backLink}>← Back to Projects</Link>
        </div>
      </aside>

      <main style={{ ...currentStyles.main, display: 'flex', flexDirection: 'column', padding: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', minHeight: '60px', gap: '16px' }}>
          <LivePresence />
          <NotificationBell />
        </header>
        <div style={{ flex: 1, overflow: 'auto', padding: isBoard ? (isMobile ? '8px' : '24px') : (isMobile ? '16px' : '32px') }}>
          <Outlet context={{ project }} />
        </div>
      </main>
    </div>
  );
}

const getStyles = (isMobile: boolean, isSidebarOpen: boolean, isBoard: boolean = false): Record<string, React.CSSProperties> => ({
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  container: {
    display: 'flex',
    minHeight: '100vh',
    position: 'relative',
  },
  mobileMenuBtn: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--surface-color)',
    borderRight: '1px solid var(--border-color)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    position: isMobile ? 'fixed' : 'static',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
    transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
    transition: 'transform 0.3s ease',
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
    padding: isBoard ? (isMobile ? 'var(--space-2)' : 'var(--space-4)') : (isMobile ? 'var(--space-4)' : 'var(--space-8)'),
    overflowY: 'auto',
    overflowX: 'auto',
    backgroundColor: 'var(--bg-color)',
    width: isMobile ? '100%' : 'calc(100% - 260px)',
  },
});
