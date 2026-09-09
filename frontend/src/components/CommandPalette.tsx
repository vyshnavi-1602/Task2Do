import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Loader2, FileText, Layout, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Global hotkey Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else if (!isOpen) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, workspaceId],
    queryFn: async () => {
      if (!debouncedQuery) return null;
      const res = await apiClient.get('/search', {
        params: { q: debouncedQuery, workspaceId }
      });
      return res.data;
    },
    enabled: isOpen && debouncedQuery.length > 0,
  });

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div 
      className="command-palette-backdrop"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh'
      }}
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="command-palette-modal"
        style={{
          width: '100%', maxWidth: '600px', backgroundColor: 'var(--bg-color)',
          borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          overflow: 'hidden', border: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <Search size={20} color="var(--text-secondary)" style={{ marginRight: '12px' }} />
          <input 
            ref={inputRef}
            placeholder="Search issues, projects, or users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: '1.1rem', color: 'var(--text-primary)', outline: 'none'
            }}
          />
          {isLoading && <Loader2 className="spinner" size={20} color="var(--text-secondary)" />}
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {!query && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Type to start searching...
            </div>
          )}

          {data && (
            <div style={{ padding: '8px 0' }}>
              {data.issues?.length > 0 && (
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Issues</div>
                  {data.issues.map((issue: any) => (
                    <div 
                      key={issue.id} 
                      onClick={() => handleNavigate(`/workspaces/${issue.project.workspaceId}/projects/${issue.projectId}/board?issueId=${issue.id}`)}
                      style={{
                        padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
                      }}
                      className="search-item"
                    >
                      <FileText size={16} color="var(--primary-color)" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{issue.title}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{issue.key} • {issue.status?.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.projects?.length > 0 && (
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Projects</div>
                  {data.projects.map((project: any) => (
                    <div 
                      key={project.id} 
                      onClick={() => handleNavigate(`/workspaces/${project.workspaceId}/projects/${project.id}`)}
                      style={{
                        padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
                      }}
                      className="search-item"
                    >
                      <Layout size={16} color="var(--success-color)" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{project.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{project.key}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.users?.length > 0 && (
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Users</div>
                  {data.users.map((u: any) => (
                    <div 
                      key={u.id} 
                      onClick={() => handleNavigate(`/profile/${u.id}`)}
                      style={{
                        padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
                      }}
                      className="search-item"
                    >
                      <User size={16} color="var(--warning-color)" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.issues?.length === 0 && data.projects?.length === 0 && data.users?.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No results found for "{debouncedQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .search-item:hover { background-color: var(--surface-color); }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
