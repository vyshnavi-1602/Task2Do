import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from '../components/notifications/NotificationBell';

interface Workspace {
  id: string;
  name: string;
  _count?: { projects: number; members: number };
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [theme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as any) || 'light';
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const data = await apiClient.get('/workspaces');
      return data as unknown as Workspace[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const data = await apiClient.post('/workspaces', { name });
      return data as unknown as Workspace;
    },
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setIsCreating(false);
      setNewWorkspaceName('');
      navigate(`/workspaces/${newWorkspace.id}/projects`);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createMutation.mutate(newWorkspaceName);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isDark = theme === 'dark';
  const currentStyles = getStyles(isDark, isMobile);

  if (isLoading) {
    return (
      <div style={currentStyles.center}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={currentStyles.container}>
      {/* Top Navigation */}
      <nav style={currentStyles.nav}>
        <div style={currentStyles.logoContainer}>
          <img src="/logo.png" alt="Task2Do Logo" style={currentStyles.logoImage} />
        </div>
        
        <div style={currentStyles.navActions}>
          <NotificationBell />
          <div style={currentStyles.userGreeting}>
            <div style={currentStyles.avatar}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            {!isMobile && <span>{user?.name}</span>}
          </div>
          <button style={currentStyles.textButton} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Main Layout */}
      <div style={currentStyles.mainLayout}>
        
        {/* Sidebar */}
        <aside style={currentStyles.sidebar}>
          <div style={currentStyles.sidebarItemActive}>
            <span style={{marginRight: '8px'}}>📁</span> Workspaces
          </div>
          <div style={currentStyles.sidebarItem}>
            <span style={{marginRight: '8px'}}>⚙️</span> Settings
          </div>
        </aside>

        {/* Content Area */}
        <main style={currentStyles.content}>
          <div style={currentStyles.contentHeader}>
            <h2 style={currentStyles.pageTitle}>Your Workspaces</h2>
            {!isCreating && (
              <button 
                style={currentStyles.primaryButton}
                onClick={() => setIsCreating(true)}
              >
                + New Workspace
              </button>
            )}
          </div>

          {error && <div style={currentStyles.errorAlert}>Failed to load workspaces.</div>}

          {isCreating && (
            <div style={currentStyles.createCard}>
              <h3 style={currentStyles.createCardTitle}>Create a new workspace</h3>
              <form onSubmit={handleCreate} style={currentStyles.createForm}>
                <input
                  type="text"
                  placeholder="Workspace Name (e.g., Acme Corp)"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  style={currentStyles.input}
                  autoFocus
                  required
                />
                <div style={currentStyles.formActions}>
                  <button type="button" onClick={() => setIsCreating(false)} style={currentStyles.secondaryButton}>
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} style={currentStyles.primaryButton}>
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={currentStyles.grid}>
            {workspaces?.map((workspace) => (
              <div 
                key={workspace.id} 
                style={currentStyles.card}
                onClick={() => navigate(`/workspaces/${workspace.id}/projects`)}
              >
                <div style={currentStyles.cardHeader}>
                  <h4 style={currentStyles.cardTitle}>{workspace.name}</h4>
                  <span style={currentStyles.statusTag}>Active</span>
                </div>
                <p style={currentStyles.cardDesc}>Manage projects and team members in this workspace.</p>
                <div style={currentStyles.cardFooter}>
                  <div style={currentStyles.metaInfo}>
                    <span>{workspace._count?.projects || 0} Projects</span>
                    <span>•</span>
                    <span>{workspace._count?.members || 0} Members</span>
                  </div>
                </div>
              </div>
            ))}

            {workspaces?.length === 0 && !isCreating && (
              <div style={currentStyles.emptyState}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
                <h3 style={currentStyles.emptyTitle}>Welcome to Task2Do!</h3>
                <p style={currentStyles.emptyDesc}>You don't belong to any workspaces yet. Create one to get started.</p>
                <button 
                  style={currentStyles.primaryButton}
                  onClick={() => setIsCreating(true)}
                >
                  Create your first workspace
                </button>
              </div>
            )}
          </div>

          {/* Dummy Recent Activity Section to match Hero Mockup styling */}
          <div style={currentStyles.activitySection}>
            <h3 style={currentStyles.sectionTitle}>Recent Activity</h3>
            <div style={currentStyles.activityList}>
              <div style={currentStyles.activityItem}>
                <div style={{...currentStyles.avatarSmall, backgroundColor: '#3b82f6'}}>SY</div>
                <p style={currentStyles.activityText}><strong>System</strong> initialized your account.</p>
                <span style={currentStyles.activityTime}>Just now</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const getStyles = (isDark: boolean, isMobile: boolean): Record<string, React.CSSProperties> => {
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const surface = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const primary = '#0d9488';

  return {
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: bg,
    },
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: bg,
      color: textPrimary,
      fontFamily: '"Inter", -apple-system, sans-serif',
    },
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: surface,
      borderBottom: `1px solid ${border}`,
      zIndex: 10,
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    logoImage: {
      height: '32px',
      objectFit: 'contain',
    },
    logoText: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: textPrimary,
      letterSpacing: '-0.02em',
    },
    navActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
    },
    userGreeting: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '0.9rem',
      fontWeight: 500,
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: primary,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      fontSize: '0.85rem',
    },
    textButton: {
      background: 'none',
      border: 'none',
      color: textSecondary,
      fontWeight: 500,
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'color 0.2s',
    },
    mainLayout: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      flex: 1,
      overflow: 'hidden',
    },
    sidebar: {
      display: isMobile ? 'none' : 'flex',
      width: '240px',
      backgroundColor: surface,
      borderRight: `1px solid ${border}`,
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      gap: '0.5rem',
    },
    sidebarItemActive: {
      padding: '0.75rem 1rem',
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
      borderRadius: '8px',
      fontSize: '0.95rem',
      fontWeight: 600,
      color: textPrimary,
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
    },
    sidebarItem: {
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      fontSize: '0.95rem',
      color: textSecondary,
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'background-color 0.2s, color 0.2s',
    },
    content: {
      flex: 1,
      padding: isMobile ? '1.5rem' : '3rem',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    },
    contentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    },
    pageTitle: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: textPrimary,
      margin: 0,
      letterSpacing: '-0.02em',
    },
    primaryButton: {
      backgroundColor: primary,
      color: '#fff',
      border: 'none',
      padding: '0.75rem 1.25rem',
      borderRadius: '8px',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '0.9rem',
      boxShadow: '0 2px 4px rgba(13, 148, 136, 0.15)',
      transition: 'transform 0.1s, box-shadow 0.1s',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: textPrimary,
      border: `1px solid ${border}`,
      padding: '0.75rem 1.25rem',
      borderRadius: '8px',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'background-color 0.2s',
    },
    errorAlert: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '2rem',
      fontSize: '0.9rem',
    },
    createCard: {
      backgroundColor: surface,
      border: `1px solid ${border}`,
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    },
    createCardTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      marginBottom: '1.5rem',
      color: textPrimary,
    },
    createForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    input: {
      padding: '0.875rem 1rem',
      borderRadius: '8px',
      border: `1px solid ${border}`,
      backgroundColor: bg,
      color: textPrimary,
      fontSize: '1rem',
      outline: 'none',
    },
    formActions: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'flex-end',
      marginTop: '0.5rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem',
    },
    card: {
      backgroundColor: surface,
      border: `1px solid ${border}`,
      borderRadius: '16px',
      padding: '1.5rem',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '0.75rem',
    },
    cardTitle: {
      fontSize: '1.15rem',
      fontWeight: 600,
      color: textPrimary,
      margin: 0,
    },
    statusTag: {
      fontSize: '0.7rem',
      fontWeight: 600,
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      backgroundColor: 'rgba(13, 148, 136, 0.1)',
      color: primary,
    },
    cardDesc: {
      fontSize: '0.9rem',
      color: textSecondary,
      lineHeight: 1.5,
      marginBottom: '1.5rem',
      flex: 1,
    },
    cardFooter: {
      display: 'flex',
      borderTop: `1px solid ${border}`,
      paddingTop: '1rem',
    },
    metaInfo: {
      display: 'flex',
      gap: '0.5rem',
      color: textMuted,
      fontSize: '0.85rem',
      fontWeight: 500,
    },
    emptyState: {
      gridColumn: '1 / -1',
      textAlign: 'center',
      padding: '4rem 2rem',
      backgroundColor: surface,
      borderRadius: '16px',
      border: `1px dashed ${border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    emptyTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      marginBottom: '0.5rem',
      color: textPrimary,
    },
    emptyDesc: {
      color: textSecondary,
      marginBottom: '2rem',
      maxWidth: '400px',
      lineHeight: 1.5,
    },
    activitySection: {
      backgroundColor: surface,
      border: `1px solid ${border}`,
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: textPrimary,
      marginBottom: '1.5rem',
    },
    activityList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    activityItem: {
      display: 'flex',
      alignItems: 'center',
      paddingBottom: '1rem',
      borderBottom: `1px solid ${border}`,
    },
    avatarSmall: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      fontWeight: 700,
      flexShrink: 0,
    },
    activityText: {
      fontSize: '0.95rem',
      color: textSecondary,
      marginLeft: '1rem',
      flex: 1,
    },
    activityTime: {
      fontSize: '0.8rem',
      color: textMuted,
      whiteSpace: 'nowrap',
    },
  };
};
