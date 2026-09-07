import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const UserDropdown: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const bg = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ position: 'relative' }}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer', 
          padding: '0.25rem 0.5rem', 
          borderRadius: '8px', 
          transition: 'background-color 0.2s' 
        }} 
        onClick={() => setShowDropdown(!showDropdown)}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-color)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
      
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          backgroundColor: bg,
          border: `1px solid ${border}`,
          borderRadius: '8px',
          padding: '1rem',
          minWidth: '220px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}>
          <div style={{ fontWeight: 600, color: textPrimary, marginBottom: '0.25rem' }}>{user?.name}</div>
          <div style={{ fontSize: '0.85rem', color: textSecondary, marginBottom: '1rem', wordBreak: 'break-all' }}>{user?.email}</div>
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              style={{
                background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer',
                textAlign: 'left', width: '100%', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px'
              }} 
              onClick={handleLogout}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
