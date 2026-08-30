import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface Member {
  id: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export default function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: async () => {
      const data = await apiClient.get(`/workspaces/${workspaceId}/members`);
      return data as unknown as Member[];
    },
  });

  const currentUserMember = members?.find(m => m.user.id === currentUser?.id);
  const isAdmin = currentUserMember?.role === 'ADMIN';

  const inviteMutation = useMutation({
    mutationFn: async (newMember: { email: string; role: string }) => {
      const data = await apiClient.post(`/workspaces/${workspaceId}/members`, newMember);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
      setIsInviting(false);
      setEmail('');
      setRole('MEMBER');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      await apiClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate({ email, role });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>Workspace Members</h1>
        {isAdmin && (
          <button 
            style={styles.primaryButton}
            onClick={() => setIsInviting(true)}
          >
            Add Member
          </button>
        )}
      </header>

      {error && <div style={styles.error}>Failed to load members.</div>}
      
      {inviteMutation.isError && (
        <div style={styles.errorAlert}>{(inviteMutation.error as any)?.response?.data?.error?.message || 'Failed to add member.'}</div>
      )}
      {updateRoleMutation.isError && (
        <div style={styles.errorAlert}>{(updateRoleMutation.error as any)?.response?.data?.error?.message || 'Failed to update role.'}</div>
      )}
      {removeMutation.isError && (
        <div style={styles.errorAlert}>{(removeMutation.error as any)?.response?.data?.error?.message || 'Failed to remove member.'}</div>
      )}

      {isInviting && (
        <form onSubmit={handleInvite} style={styles.createForm}>
          <div style={styles.formRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={{ ...styles.inputGroup, flex: '0 0 150px' }}>
              <label style={styles.label}>Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
                style={styles.select}
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>
          <div style={styles.formActions}>
            <button type="button" onClick={() => setIsInviting(false)} style={styles.secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={inviteMutation.isPending} style={styles.primaryButton}>
              {inviteMutation.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              {isAdmin && <th style={styles.th}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members?.map((member) => (
              <tr key={member.id} style={styles.tr}>
                <td style={styles.td}><strong>{member.user.name}</strong></td>
                <td style={{ ...styles.td, color: 'var(--text-secondary)' }}>{member.user.email}</td>
                <td style={styles.td}>
                  {isAdmin && member.user.id !== currentUser?.id ? (
                    <select 
                      value={member.role}
                      onChange={(e) => updateRoleMutation.mutate({ userId: member.user.id, newRole: e.target.value })}
                      style={styles.inlineSelect}
                      disabled={updateRoleMutation.isPending}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  ) : (
                    <span style={styles.badge}>{member.role}</span>
                  )}
                </td>
                {isAdmin && (
                  <td style={styles.td}>
                    {member.user.id !== currentUser?.id && (
                      <button 
                        onClick={() => removeMutation.mutate(member.user.id)}
                        style={styles.dangerButton}
                        disabled={removeMutation.isPending}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-6)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  primaryButton: {
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    color: 'var(--error-color)',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem',
    border: '1px solid var(--error-color)',
    cursor: 'pointer',
  },
  createForm: {
    backgroundColor: 'var(--surface-color)',
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    marginBottom: 'var(--space-8)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  formRow: {
    display: 'flex',
    gap: 'var(--space-4)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    flex: 1,
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
  select: {
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  },
  inlineSelect: {
    padding: 'var(--space-1)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-primary)',
  },
  formActions: {
    display: 'flex',
    gap: 'var(--space-2)',
    justifyContent: 'flex-end',
  },
  tableContainer: {
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: 'var(--space-3) var(--space-4)',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  error: {
    color: 'var(--error-color)',
    marginBottom: 'var(--space-4)',
  },
  errorAlert: {
    padding: 'var(--space-3)',
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    color: 'var(--error-color)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--error-color)',
    marginBottom: 'var(--space-4)',
  },
};
