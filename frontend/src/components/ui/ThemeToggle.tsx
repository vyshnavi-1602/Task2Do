import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color)',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        transition: 'background-color 0.2s, color 0.2s',
      }}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-color)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};
