import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/login', { email, password });
      return response;
    },
    onSuccess: (data: any) => {
      login(data);
      navigate('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    mutate();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome back to Task2Do</h2>
        <p style={styles.subtitle}>Sign in to your account</p>

        {error && (
          <div style={styles.errorAlert}>
            {error.message || 'Login failed. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={styles.input} 
              required 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input} 
              required 
            />
          </div>

          <button type="submit" disabled={isPending} style={styles.button}>
            {isPending ? <LoadingSpinner /> : 'Sign In'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-color)' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-4)',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--surface-color)',
    padding: 'var(--space-8)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: 'var(--space-2)',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-6)',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  input: {
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  },
  button: {
    padding: 'var(--space-3)',
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '1rem',
    marginTop: 'var(--space-2)',
    transition: 'background-color var(--transition-fast)',
  },
  errorAlert: {
    padding: 'var(--space-3)',
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    color: 'var(--error-color)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--error-color)',
    marginBottom: 'var(--space-4)',
    fontSize: '0.875rem',
  },
  footerText: {
    marginTop: 'var(--space-6)',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  }
};
