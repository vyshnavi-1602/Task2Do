import { useQuery } from '@tanstack/react-query';
import { Server, Database, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import '../styles/index.css';

// Type describing the expected backend response
interface HealthData {
  server: string;
  database: string;
}

export default function LandingPage() {
  const { data, isLoading, isError, error } = useQuery<HealthData>({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const response = await apiClient.get('/health');
      return response as unknown as HealthData;
    },
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Task2Do</h1>
        <p style={styles.subtitle}>
          The complete Agile project management application. <br />
          Built for speed, clarity, and focus.
        </p>
      </header>

      <section style={styles.statusSection}>
        <h2 style={styles.statusTitle}>System Status</h2>
        
        <div style={styles.card}>
          {isLoading ? (
            <div style={styles.statusRow}>
              <LoadingSpinner />
              <span style={{ color: 'var(--text-secondary)' }}>Checking system status...</span>
            </div>
          ) : isError ? (
            <div style={styles.statusRow}>
              <XCircle color="var(--error-color)" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--error-color)', fontWeight: 600 }}>Unable to connect to backend</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{error?.message || 'Network error'}</span>
              </div>
            </div>
          ) : (
            <div style={styles.grid}>
              <div style={styles.statusItem}>
                <Server color="var(--text-secondary)" />
                <div style={styles.statusTextGroup}>
                  <span style={styles.statusLabel}>Backend</span>
                  <div style={styles.statusValue}>
                    <CheckCircle2 size={16} color="var(--success-color)" />
                    <span style={{ color: 'var(--success-color)' }}>{data?.server === 'up' ? 'Connected' : 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div style={styles.statusItem}>
                <Database color="var(--text-secondary)" />
                <div style={styles.statusTextGroup}>
                  <span style={styles.statusLabel}>Database</span>
                  <div style={styles.statusValue}>
                    <CheckCircle2 size={16} color="var(--success-color)" />
                    <span style={{ color: 'var(--success-color)' }}>{data?.database === 'connected' ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Inline styles for the landing page using our CSS Custom Properties
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-4)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 'var(--space-8)',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    marginBottom: 'var(--space-2)',
    background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    maxWidth: '500px',
  },
  statusSection: {
    width: '100%',
    maxWidth: '600px',
  },
  statusTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: 'var(--space-4)',
    color: 'var(--text-primary)',
  },
  card: {
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    boxShadow: 'var(--shadow-md)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-4)',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-4)',
    backgroundColor: 'var(--bg-color)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
  },
  statusTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  statusLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  statusValue: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: '1rem',
    fontWeight: 600,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-4)',
  },
};
