import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../context/ThemeContext';

export default function HeroPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Removed auto-redirect to dashboard so users can view the hero page even if logged in.

  const isDark = theme === 'dark';
  const currentStyles = getStyles(isDark, isMobile);

  return (
    <div style={currentStyles.container}>
      {/* Navbar Area */}
      <nav style={currentStyles.nav}>
        <div style={currentStyles.logo}>
          <img src="/logo.png" alt="Task2Do Logo" style={currentStyles.logoImage} />
        </div>
        
        <div style={currentStyles.navLinks}>
          <a href="#features" style={currentStyles.navLink}>Features</a>
          <a href="#workspaces" style={currentStyles.navLink}>Workspaces</a>
          <a href="#features" style={currentStyles.navLink}>About</a>
        </div>

        <div style={currentStyles.navActions}>
          <button 
            onClick={toggleTheme} 
            style={currentStyles.themeToggle}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button 
            style={currentStyles.textButton} 
            onClick={() => navigate('/login')}
          >
            Log in
          </button>
          <button 
            style={currentStyles.pillButtonDark} 
            onClick={() => navigate('/register')}
          >
            Sign up for free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={currentStyles.main}>
        <div style={currentStyles.heroContent}>
          
          <h1 style={currentStyles.title}>
            Master Your Workflow.
            <br />
            <span style={currentStyles.highlightWrapper}>
              Build with Agile.
              <svg 
                style={currentStyles.underline} 
                viewBox="0 0 200 20" 
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M5 15Q50 5 100 10T195 15" 
                  stroke="#0d9488" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeLinecap="round" 
                />
              </svg>
            </span>
          </h1>
          
          <p style={currentStyles.subtitle}>
            A delightfully simple, powerfully effective project management tool. Create workspaces, invite your team, and organize sprints with zero friction.
          </p>
          
          <div style={currentStyles.ctaGroup}>
            <button 
              style={currentStyles.primaryCta} 
              onClick={() => navigate('/register')}
            >
              Get Started
            </button>
            <button 
              style={currentStyles.secondaryCta} 
              onClick={() => navigate('/login')}
            >
              Try For Free <span style={{ marginLeft: '4px' }}>›</span>
            </button>
          </div>
        </div>

        {/* Dashboard Mockup Frame matching Task2Do */}
        <div id="workspaces" style={currentStyles.mockupContainer}>
          <div style={currentStyles.mockupHeader}>
            <div style={currentStyles.mockupDots}>
              <div style={{...currentStyles.dot, backgroundColor: '#ff5f56'}}></div>
              <div style={{...currentStyles.dot, backgroundColor: '#ffbd2e'}}></div>
              <div style={{...currentStyles.dot, backgroundColor: '#27c93f'}}></div>
            </div>
            <div style={currentStyles.mockupTitle}>Task2Do Dashboard - Acme Corp Workspace</div>
          </div>
          <div style={currentStyles.mockupBody}>
            {/* Sidebar matching Workspace layout */}
            <div style={currentStyles.wireSidebar}>
              <div style={currentStyles.sidebarItemActive}>
                <span style={{marginRight: '8px'}}>📁</span> Projects
              </div>
              <div style={currentStyles.sidebarItem}>
                <span style={{marginRight: '8px'}}>👥</span> Members
              </div>
              <div style={currentStyles.sidebarItem}>
                <span style={{marginRight: '8px'}}>⚙️</span> Settings
              </div>
            </div>
            {/* Main Content matching Projects/Members view */}
            <div style={currentStyles.wireContent}>
              <div style={currentStyles.wireHeader}>
                <h3 style={currentStyles.mockupHeading}>Active Projects</h3>
                <button style={currentStyles.mockupButton}>+ New Project</button>
              </div>
              <div style={currentStyles.wireGrid}>
                {/* Project Cards */}
                <div style={currentStyles.interactiveCard}>
                  <div style={currentStyles.cardHeader}>
                    <h4 style={currentStyles.cardTitle}>Website Redesign</h4>
                    <span style={currentStyles.statusTagInProgress}>In Progress</span>
                  </div>
                  <p style={currentStyles.cardDesc}>Overhaul the main landing page.</p>
                  <div style={currentStyles.cardFooter}>
                    <div style={{display: 'flex', gap: '4px'}}>
                       <div style={{...currentStyles.avatar, backgroundColor: '#3b82f6'}}>JD</div>
                       <div style={{...currentStyles.avatar, backgroundColor: '#f59e0b'}}>AS</div>
                    </div>
                    <span style={currentStyles.date}>Oct 12</span>
                  </div>
                </div>
                
                <div style={currentStyles.interactiveCard}>
                  <div style={currentStyles.cardHeader}>
                    <h4 style={currentStyles.cardTitle}>Mobile API</h4>
                    <span style={currentStyles.statusTagDone}>Done</span>
                  </div>
                  <p style={currentStyles.cardDesc}>V1 endpoints for the iOS client.</p>
                  <div style={currentStyles.cardFooter}>
                    <div style={{display: 'flex', gap: '4px'}}>
                       <div style={{...currentStyles.avatar, backgroundColor: '#10b981'}}>MR</div>
                    </div>
                    <span style={currentStyles.date}>Oct 01</span>
                  </div>
                </div>
                
                <div style={currentStyles.interactiveCard}>
                  <div style={currentStyles.cardHeader}>
                    <h4 style={currentStyles.cardTitle}>Marketing Assets</h4>
                    <span style={currentStyles.statusTagTodo}>To Do</span>
                  </div>
                  <p style={currentStyles.cardDesc}>Prepare Q4 campaign materials.</p>
                  <div style={currentStyles.cardFooter}>
                    <div style={{display: 'flex', gap: '4px'}}>
                       <div style={{...currentStyles.avatar, backgroundColor: '#8b5cf6'}}>KW</div>
                    </div>
                    <span style={currentStyles.date}>Nov 05</span>
                  </div>
                </div>

                {/* Activity section */}
                <div style={currentStyles.interactiveCardLarge}>
                  <h4 style={currentStyles.cardTitle}>Recent Activity</h4>
                  <div style={currentStyles.activityList}>
                    <div style={currentStyles.activityItem}>
                      <div style={{...currentStyles.avatarSmall, backgroundColor: '#3b82f6'}}>JD</div>
                      <p style={currentStyles.activityText}><strong>John Doe</strong> completed task <em>Design System</em></p>
                      <span style={currentStyles.activityTime}>2h ago</span>
                    </div>
                    <div style={currentStyles.activityItem}>
                      <div style={{...currentStyles.avatarSmall, backgroundColor: '#f59e0b'}}>AS</div>
                      <p style={currentStyles.activityText}><strong>Alice Smith</strong> commented on <em>Auth Endpoints</em></p>
                      <span style={currentStyles.activityTime}>4h ago</span>
                    </div>
                    <div style={currentStyles.activityItem}>
                      <div style={{...currentStyles.avatarSmall, backgroundColor: '#10b981'}}>MR</div>
                      <p style={currentStyles.activityText}><strong>Mark Roe</strong> created project <em>Marketing Assets</em></p>
                      <span style={currentStyles.activityTime}>1d ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" style={currentStyles.aboutSection}>
        <h2 style={currentStyles.aboutTitle}>Why Task2Do?</h2>
        <p style={currentStyles.aboutSubtitle}>
          We built Task2Do because we were tired of bloated, overly complex project management tools. 
        </p>
        <div style={currentStyles.featureGrid}>
          <div style={currentStyles.featureCard} className="feature-card">
            <div style={currentStyles.featureIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h3 style={currentStyles.featureTitle}>Lightning Fast</h3>
            <p style={currentStyles.featureText}>Built for speed. Navigate between projects and update tasks instantly without waiting.</p>
          </div>
          <div style={currentStyles.featureCard} className="feature-card">
            <div style={currentStyles.featureIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path><path d="M12 2v2"></path><path d="M12 22v-2"></path><path d="m17 20.66-1-1.73"></path><path d="M11 10.27 7 3.34"></path><path d="m20.66 17-1.73-1"></path><path d="m3.34 7 1.73 1"></path><path d="M14 12h8"></path><path d="M2 12h2"></path><path d="m20.66 7-1.73 1"></path><path d="m3.34 17 1.73-1"></path><path d="m17 3.34-1 1.73"></path><path d="m11 13.73-4 6.93"></path></svg>
            </div>
            <h3 style={currentStyles.featureTitle}>Intuitive Design</h3>
            <p style={currentStyles.featureText}>A beautifully crafted interface that gets out of your way and lets your team focus.</p>
          </div>
          <div style={currentStyles.featureCard} className="feature-card">
            <div style={currentStyles.featureIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
            </div>
            <h3 style={currentStyles.featureTitle}>Agile Ready</h3>
            <p style={currentStyles.featureText}>Perfect for sprints, kanban, or whatever agile workflow your team uses to ship.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={currentStyles.footer}>
        <div style={currentStyles.footerContent}>
          <div style={currentStyles.footerBrand}>
            <img src="/logo.png" alt="Task2Do Logo" style={currentStyles.footerLogo} />
            <p style={currentStyles.footerDesc}>
              The new standard in agile management. Build, track, and ship software without the friction.
            </p>
          </div>
          
          <div style={currentStyles.footerLinksContainer}>
            <div style={currentStyles.footerLinksCol}>
              <h4 style={currentStyles.footerLinksTitle}>Product</h4>
              <a href="#features" style={currentStyles.footerLink}>Features</a>
              <a href="#pricing" style={currentStyles.footerLink}>Pricing</a>
              <a href="#about" style={currentStyles.footerLink}>About Us</a>
            </div>
            <div style={currentStyles.footerLinksCol}>
              <h4 style={currentStyles.footerLinksTitle}>Legal</h4>
              <a href="#privacy" style={currentStyles.footerLink}>Privacy Policy</a>
              <a href="#terms" style={currentStyles.footerLink}>Terms of Service</a>
            </div>
          </div>
        </div>
        
        <div style={currentStyles.footerBottom}>
          <p>© 2026 Task2Do. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const getStyles = (isDark: boolean, isMobile: boolean): Record<string, React.CSSProperties> => {
  const bg = isDark ? '#0f172a' : '#F9FBFC';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const textMuted = isDark ? '#64748b' : '#64748b';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const surface = isDark ? '#1e293b' : '#ffffff';
  const surfaceHover = isDark ? '#334155' : '#f1f5f9';
  const pillDarkBg = isDark ? '#f8fafc' : '#0f172a';
  const pillDarkText = isDark ? '#0f172a' : '#fff';

  return {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: bg,
      color: textPrimary,
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    },
    nav: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? '1rem' : '1.5rem 4rem',
      gap: isMobile ? '1.5rem' : '0',
      backgroundColor: 'transparent',
      zIndex: 10,
      position: 'relative',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
    },
    logoImage: {
      height: '36px', // Adjust depending on logo proportions
      objectFit: 'contain',
    },
    navLinks: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: isMobile ? '1.5rem' : '2.5rem',
      alignItems: 'center',
    },
    navLink: {
      color: textSecondary,
      textDecoration: 'none',
      fontWeight: 500,
      fontSize: '1rem',
      transition: 'color 0.2s',
    },
    navActions: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '1rem',
      alignItems: 'center',
    },
    themeToggle: {
      background: 'none',
      border: `1px solid ${border}`,
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1.25rem',
      color: textPrimary,
      transition: 'background-color 0.2s',
    },
    textButton: {
      background: 'none',
      border: 'none',
      color: textPrimary,
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '1rem',
      padding: '0.5rem 1rem',
    },
    pillButtonDark: {
      backgroundColor: pillDarkBg,
      color: pillDarkText,
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '9999px',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '0.95rem',
      transition: 'background-color 0.2s ease',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: isMobile ? '2rem 1rem 0' : '4rem 2rem 0',
      textAlign: 'center',
      zIndex: 1,
    },
    heroContent: {
      maxWidth: '900px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '4rem',
    },
    badge: {
      backgroundColor: surface,
      color: textPrimary,
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: 600,
      marginBottom: '2.5rem',
      border: `1px solid ${border}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
    },
    badgeEmoji: {
      fontSize: '1rem',
    },
    title: {
      fontSize: isMobile ? '2.5rem' : '4.5rem',
      fontWeight: 800,
      lineHeight: 1.15,
      marginBottom: '1.5rem',
      letterSpacing: '-0.03em',
      color: textPrimary,
    },
    highlightWrapper: {
      position: 'relative',
      display: 'inline-block',
      zIndex: 1,
    },
    underline: {
      position: 'absolute',
      bottom: '-8px',
      left: '0',
      width: '100%',
      height: '16px',
      zIndex: -1,
      opacity: 0.8,
    },
    subtitle: {
      fontSize: isMobile ? '1rem' : '1.25rem',
      color: textMuted,
      lineHeight: 1.7,
      marginBottom: '2.5rem',
      maxWidth: '600px',
      fontWeight: 400,
      padding: isMobile ? '0 1rem' : '0',
    },
    ctaGroup: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '1rem',
      justifyContent: 'center',
      width: isMobile ? '100%' : 'auto',
      maxWidth: '400px',
    },
    primaryCta: {
      backgroundColor: '#0d9488',
      color: '#fff',
      border: 'none',
      padding: '1rem 2.5rem',
      borderRadius: '9999px',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '1.125rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxShadow: '0 4px 14px rgba(13, 148, 136, 0.2)',
    },
    secondaryCta: {
      backgroundColor: surface,
      color: textPrimary,
      border: `1px solid ${border}`,
      padding: '1rem 2.5rem',
      borderRadius: '9999px',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '1.125rem',
      display: 'flex',
      alignItems: 'center',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    },
    
    // Mockup
    mockupContainer: {
      width: '100%',
      maxWidth: '1100px',
      backgroundColor: surface,
      borderRadius: '24px 24px 0 0',
      border: `1px solid ${border}`,
      borderBottom: 'none',
      boxShadow: isDark ? '0 -10px 40px rgba(0,0,0,0.5)' : '0 20px 40px -10px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: isMobile ? 'auto' : '400px',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
    },
    mockupHeader: {
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      padding: '1rem 1.5rem',
      borderBottom: `1px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      transition: 'background-color 0.3s ease',
    },
    mockupDots: {
      display: 'flex',
      gap: '0.5rem',
    },
    dot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
    },
    mockupTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: '0.875rem',
      color: textMuted,
      fontWeight: 500,
      marginRight: '48px',
    },
    mockupBody: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      flex: 1,
      padding: '1.5rem',
      gap: '1.5rem',
      backgroundColor: isDark ? '#0f172a' : '#fdfdfd',
      transition: 'background-color 0.3s ease',
    },
    wireSidebar: {
      display: isMobile ? 'none' : 'flex',
      width: '200px',
      backgroundColor: surfaceHover,
      borderRadius: '12px',
      height: '100%',
      padding: '1rem',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    sidebarItemActive: {
      padding: '0.5rem 0.75rem',
      backgroundColor: isDark ? '#475569' : '#e2e8f0',
      borderRadius: '6px',
      fontSize: '0.875rem',
      fontWeight: 600,
      color: textPrimary,
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
    },
    sidebarItem: {
      padding: '0.5rem 0.75rem',
      borderRadius: '6px',
      fontSize: '0.875rem',
      color: textSecondary,
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    wireContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    wireHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mockupHeading: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: textPrimary,
      margin: 0,
    },
    mockupButton: {
      backgroundColor: '#0d9488',
      color: '#fff',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: 'pointer',
    },
    wireGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: '1rem',
    },
    interactiveCard: {
      backgroundColor: surface,
      border: `1px solid ${border}`,
      borderRadius: '12px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      textAlign: 'left',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '0.5rem',
    },
    cardTitle: {
      fontSize: '0.95rem',
      fontWeight: 600,
      color: textPrimary,
      margin: 0,
    },
    statusTagInProgress: {
      fontSize: '0.65rem',
      fontWeight: 600,
      padding: '0.15rem 0.4rem',
      borderRadius: '4px',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6',
    },
    statusTagDone: {
      fontSize: '0.65rem',
      fontWeight: 600,
      padding: '0.15rem 0.4rem',
      borderRadius: '4px',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
    },
    statusTagTodo: {
      fontSize: '0.65rem',
      fontWeight: 600,
      padding: '0.15rem 0.4rem',
      borderRadius: '4px',
      backgroundColor: 'rgba(100, 116, 139, 0.1)',
      color: textSecondary,
    },
    cardDesc: {
      fontSize: '0.8rem',
      color: textSecondary,
      lineHeight: 1.4,
      flex: 1,
      marginBottom: '1rem',
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: `1px solid ${border}`,
      paddingTop: '0.75rem',
    },
    avatar: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.55rem',
      fontWeight: 700,
    },
    avatarSmall: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.65rem',
      fontWeight: 700,
      flexShrink: 0,
    },
    date: {
      fontSize: '0.7rem',
      color: textMuted,
      fontWeight: 500,
    },
    interactiveCardLarge: {
      gridColumn: '1 / -1',
      backgroundColor: surface,
      border: `1px solid ${border}`,
      borderRadius: '12px',
      padding: '1.25rem',
      textAlign: 'left',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    activityList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      marginTop: '1rem',
    },
    activityItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem',
      borderRadius: '8px',
      transition: 'background-color 0.2s',
      cursor: 'pointer',
    },
    activityText: {
      fontSize: '0.85rem',
      color: textSecondary,
      margin: 0,
      flex: 1,
    },
    activityTime: {
      fontSize: '0.75rem',
      color: textMuted,
    },
    
    // About Section
    aboutSection: {
      padding: '6rem 2rem',
      maxWidth: '1100px',
      margin: '0 auto',
      textAlign: 'center',
    },
    aboutTitle: {
      fontSize: '2.5rem',
      fontWeight: 700,
      marginBottom: '1rem',
      color: textPrimary,
    },
    aboutSubtitle: {
      fontSize: '1.125rem',
      color: textSecondary,
      marginBottom: '4rem',
    },
    featureGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: '2.5rem',
    },
    featureCard: {
      backgroundColor: surface,
      padding: '3rem 2.5rem',
      borderRadius: '24px',
      border: `1px solid ${border}`,
      borderTop: `4px solid #0d9488`,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    featureIcon: {
      marginBottom: '1.5rem',
      backgroundColor: 'rgba(13, 148, 136, 0.08)',
      width: '64px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '18px',
      color: '#0d9488',
    },
    featureTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: textPrimary,
      marginBottom: '0.75rem',
    },
    featureText: {
      fontSize: '1rem',
      color: textSecondary,
      lineHeight: 1.6,
    },
    
    // Footer
    footer: {
      backgroundColor: surface,
      borderTop: `1px solid ${border}`,
      padding: '5rem 2rem 2rem 2rem',
    },
    footerContent: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
      gap: isMobile ? '2.5rem' : '4rem',
      maxWidth: '1100px',
      margin: '0 auto',
      marginBottom: '4rem',
    },
    footerBrand: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    footerLogo: {
      height: '36px',
      marginBottom: '1.5rem',
    },
    footerDesc: {
      color: textSecondary,
      fontSize: '0.95rem',
      lineHeight: 1.6,
      maxWidth: '320px',
    },
    footerLinksContainer: {
      display: 'contents', // Allows the columns to participate in the main grid
    },
    footerLinksCol: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    footerLinksTitle: {
      fontSize: '1.05rem',
      fontWeight: 600,
      color: textPrimary,
      marginBottom: '0.75rem',
    },
    footerLink: {
      color: textSecondary,
      textDecoration: 'none',
      fontSize: '0.95rem',
      transition: 'color 0.2s',
    },
    footerBottom: {
      borderTop: `1px solid ${border}`,
      paddingTop: '2rem',
      textAlign: 'center',
      color: textMuted,
      fontSize: '0.875rem',
      maxWidth: '1100px',
      margin: '0 auto',
      width: '100%',
    },
  };
};
