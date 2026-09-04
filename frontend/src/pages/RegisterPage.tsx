import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      const user = await apiClient.post('/auth/register', { name, email, password });
      return user;
    },
    onSuccess: (user) => {
      login(user as any);
      navigate('/dashboard');
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async (credential: string) => {
      const user = await apiClient.post('/auth/google', { credential });
      return user;
    },
    onSuccess: (user) => {
      login(user as any);
      navigate('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    mutate();
  };

  const currentStyles = getStyles(isMobile);

  return (
    <div style={currentStyles.container}>
      <Link to="/" style={currentStyles.backLink}>
        <span>←</span> Back to home
      </Link>
      
      <div style={currentStyles.mainCard}>
        {/* Left Panel: Information & Branding */}
        <div style={currentStyles.leftPanel}>
          <div style={currentStyles.logoWrapper}>
            <img src="/logo.png" alt="Task2Do Logo" style={currentStyles.logoImage} />
          </div>
          
          <h1 style={currentStyles.headline}>
            Join the agile <br />
            <span style={{ color: 'var(--accent-color)' }}>revolution.</span>
          </h1>
          <p style={currentStyles.subheadline}>
            Create your account in seconds and start managing your projects like a pro.
          </p>
          
          <div style={currentStyles.featureList}>
            <div style={currentStyles.featureItem}>
              <div style={currentStyles.featureIcon}>🚀</div>
              <div>
                <h4 style={currentStyles.featureTitle}>Fast Setup</h4>
                <p style={currentStyles.featureDesc}>Get your first workspace running instantly.</p>
              </div>
            </div>
            <div style={currentStyles.featureItem}>
              <div style={currentStyles.featureIcon}>🤝</div>
              <div>
                <h4 style={currentStyles.featureTitle}>Team Collab</h4>
                <p style={currentStyles.featureDesc}>Invite members and work together smoothly.</p>
              </div>
            </div>
            <div style={currentStyles.featureItem}>
              <div style={currentStyles.featureIcon}>🛡️</div>
              <div>
                <h4 style={currentStyles.featureTitle}>Secure</h4>
                <p style={currentStyles.featureDesc}>Your data is encrypted and safe with us.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Authentication Form */}
        <div style={currentStyles.rightPanel}>
          <div style={currentStyles.formContainer}>
            <h2 style={currentStyles.title}>Create an account</h2>
            <p style={currentStyles.subtitle}>Get started with Task2Do for free</p>

            {error && (
              <div style={currentStyles.errorAlert}>
                {error.message || 'Registration failed. Please try again.'}
              </div>
            )}

            <form onSubmit={handleSubmit} style={currentStyles.form}>
              <div style={currentStyles.inputGroup}>
                <label style={currentStyles.label}>Name</label>
                <div style={currentStyles.inputWrapper}>
                  <span style={currentStyles.inputIcon}>👤</span>
                  <input 
                    type="text" 
                    placeholder="Enter your full name"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    style={currentStyles.input} 
                    required 
                  />
                </div>
              </div>

              <div style={currentStyles.inputGroup}>
                <label style={currentStyles.label}>Email</label>
                <div style={currentStyles.inputWrapper}>
                  <span style={currentStyles.inputIcon}>✉️</span>
                  <input 
                    type="email" 
                    placeholder="Enter your email address"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    style={currentStyles.input} 
                    required 
                  />
                </div>
              </div>
              
              <div style={currentStyles.inputGroup}>
                <label style={currentStyles.label}>Password</label>
                <div style={currentStyles.inputWrapper}>
                  <span style={currentStyles.inputIcon}>🔒</span>
                  <input 
                    type="password" 
                    placeholder="Create a password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    style={currentStyles.input} 
                    required 
                  />
                </div>
              </div>

              <div style={currentStyles.actionGroup}>
                <button type="submit" disabled={isPending} style={currentStyles.button}>
                  {isPending ? <LoadingSpinner /> : 'Create account →'}
                </button>
                
                <div style={currentStyles.divider}>
                  <span style={currentStyles.dividerText}>or register with</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin 
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        googleLoginMutation.mutate(credentialResponse.credential);
                      }
                    }}
                    onError={() => {
                      console.log('Login Failed');
                    }}
                  />
                </div>
              </div>
            </form>

            <p style={currentStyles.footerText}>
              Already have an account? <Link to="/login" style={currentStyles.registerLink}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const getStyles = (isMobile: boolean): Record<string, React.CSSProperties> => ({
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-color)',
    padding: isMobile ? '1rem' : '2rem',
    position: 'relative',
  },
  backLink: {
    position: 'absolute',
    top: isMobile ? '1rem' : '2rem',
    left: isMobile ? '1rem' : '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  mainCard: {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    width: '100%',
    maxWidth: '850px',
    backgroundColor: 'var(--surface-color)',
    borderRadius: '24px',
    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
    marginTop: isMobile ? '3rem' : '0', // Leave space for back link on mobile
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: isMobile ? '2rem' : '3rem',
    backgroundColor: 'rgba(13, 148, 136, 0.03)',
    borderRight: isMobile ? 'none' : '1px solid var(--border-color)',
    borderBottom: isMobile ? '1px solid var(--border-color)' : 'none',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '2rem 1.5rem' : '2.5rem',
    backgroundColor: 'var(--surface-color)',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '3rem',
  },
  logoImage: {
    height: '35px',
    objectFit: 'contain',
  },
  headline: {
    fontSize: isMobile ? '1.75rem' : '2.2rem',
    fontWeight: 800,
    lineHeight: 1.2,
    color: 'var(--text-primary)',
    marginBottom: '1rem',
  },
  subheadline: {
    fontSize: isMobile ? '0.9rem' : '0.95rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  featureItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    color: 'var(--accent-color)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 0.25rem 0',
  },
  featureDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  formContainer: {
    width: '100%',
    maxWidth: '380px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
    textAlign: 'center',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: '2.5rem',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    textAlign: 'left',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
    fontSize: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: '#f8fafc',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    transition: 'border-color 0.2s',
  },
  actionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  button: {
    padding: '1rem',
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '0',
  },
  dividerText: {
    backgroundColor: 'var(--surface-color)',
    padding: '0 1rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    position: 'relative',
    zIndex: 1,
  },
  googleButton: {
    padding: '0.875rem',
    backgroundColor: 'var(--surface-color)',
    color: 'var(--text-primary)',
    borderRadius: '12px',
    fontWeight: 500,
    fontSize: '0.95rem',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  footerText: {
    marginTop: '2rem',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  loginLink: {
    color: 'var(--accent-color)',
    fontWeight: 600,
    textDecoration: 'none',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  },
});
