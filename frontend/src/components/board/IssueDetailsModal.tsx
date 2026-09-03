import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { ActivityFeed } from './ActivityFeed';
import { CommentSection } from './CommentSection';
import { MentionTextarea } from './MentionTextarea';
import MDEditor from '@uiw/react-md-editor';

interface IssueDetailsModalProps {
  issueId: string;
  projectId: string;
  workspaceId: string;
  onClose: () => void;
  userRole?: 'ADMIN' | 'MEMBER' | 'VIEWER'; // Passed down or derived
}

export function IssueDetailsModal({ issueId, projectId, workspaceId, onClose, userRole = 'MEMBER' }: IssueDetailsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  // New States for Day 4 features
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // 1. Fetch Issue Details
  const { data: issueRes, isLoading: issueLoading } = useQuery<any>({
    queryKey: ['issue', projectId, issueId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`)
  });

  // 2. Fetch Comments
  const { data: commentsRes } = useQuery<any>({
    queryKey: ['comments', projectId, issueId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/comments`)
  });

  // 3. Fetch Activity
  const { data: activityRes } = useQuery<any>({
    queryKey: ['activity', projectId, issueId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/activity`)
  });

  // 4. Fetch Workspace Members for Mentions
  const { data: membersRes } = useQuery<any>({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/members`)
  });

  // Combine & Sort Timeline
  const timeline = useMemo(() => {
    const comments = commentsRes || [];
    const activities = activityRes || [];
    
    const combined = [
      ...comments.map((c: any) => ({ ...c, _timelineType: 'COMMENT' })),
      ...activities.map((a: any) => ({ ...a, _timelineType: 'ACTIVITY' }))
    ];

    return combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [commentsRes, activityRes]);

  const issue = issueRes;

  // Mutations for Comments
  const createCommentMutation = useMutation({
    mutationFn: ({ text, mentionedUserIds }: { text: string, mentionedUserIds: string[] }) => 
      apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/comments`, { text, mentionedUserIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueId] });
      setCommentText('');
      setMentionedUserIds([]);
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string, text: string }) => 
      apiClient.put(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/comments/${commentId}`, { text }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueId] })
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => 
      apiClient.delete(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueId] })
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) => 
      apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/issues`, { 
        title, 
        type: 'SUB_TASK', 
        parentIssueId: issueId 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', projectId, issueId] });
      setNewSubtaskTitle('');
    }
  });

  const updateIssueMutation = useMutation({
    mutationFn: (updates: any) => 
      apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', projectId, issueId] });
      // Invalidate backlog or board to refresh assignee avatar there too
      queryClient.invalidateQueries({ queryKey: ['issues', 'backlog', projectId] });
    }
  });

  if (issueLoading) {
    return (
      <div className="modal-overlay">
        <div className="modal-container" style={{ padding: '32px', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="sidebar-label" style={{ marginBottom: 0, padding: 0 }}>{issue.key}</span>
              {issue.epic && (
                <span style={{ backgroundColor: 'rgba(101, 84, 192, 0.1)', color: '#6554c0', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', fontWeight: 600 }}>
                  🟪 {issue.epic.key} {issue.epic.title}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{issue.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="modal-content-left">
            <div className="issue-description" style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="sidebar-label" style={{ marginBottom: 0 }}>Description</h3>
                {userRole !== 'VIEWER' && !isEditingDesc && (
                  <button onClick={() => { setDescText(issue.description || ''); setIsEditingDesc(true); }} className="secondary-button" style={{ fontSize: '12px', padding: '4px 8px' }}>Edit</button>
                )}
              </div>
              
              {isEditingDesc ? (
                <div data-color-mode="dark" style={{ marginTop: '12px' }}>
                  <MDEditor
                    value={descText}
                    onChange={(val) => setDescText(val || '')}
                  />
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => {
                      updateIssueMutation.mutate({ description: descText });
                      setIsEditingDesc(false);
                    }} className="primary-button" disabled={updateIssueMutation.isPending}>Save</button>
                    <button onClick={() => setIsEditingDesc(false)} className="secondary-button">Cancel</button>
                  </div>
                </div>
              ) : (
                <div data-color-mode="dark" style={{ marginTop: '12px' }}>
                  <MDEditor.Markdown source={issue.description || 'No description provided.'} />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 className="sidebar-label">Attachments</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                {issue.attachments?.map((att: any) => (
                  <div key={att.id} style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-color)' }}>
                    <a href={`http://localhost:3000${att.url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '14px' }}>
                      📎 {att.filename}
                    </a>
                    {userRole !== 'VIEWER' && (
                      <button onClick={async () => {
                        if (confirm('Delete attachment?')) {
                          await apiClient.delete(`/attachments/${att.id}`);
                          queryClient.invalidateQueries({ queryKey: ['issue', projectId, issueId] });
                        }
                      }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>&times;</button>
                    )}
                  </div>
                ))}
                {(!issue.attachments || issue.attachments.length === 0) && (
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No attachments</span>
                )}
              </div>
              {userRole !== 'VIEWER' && (
                <div>
                  <input type="file" id="file-upload" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploading(true);
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('issueId', issueId);
                      try {
                        await apiClient.post('/attachments', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        queryClient.invalidateQueries({ queryKey: ['issue', projectId, issueId] });
                      } catch (err) {
                        console.error('Upload failed', err);
                        alert('Upload failed');
                      } finally {
                        setIsUploading(false);
                      }
                    }
                  }} />
                  <label htmlFor="file-upload" className="secondary-button" style={{ cursor: 'pointer', display: 'inline-block', fontSize: '12px', padding: '4px 8px' }}>
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </label>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 className="sidebar-label" style={{ marginBottom: 0 }}>AI Summary</h3>
                <button 
                  onClick={async () => {
                    setIsSummarizing(true);
                    try {
                      const res = await apiClient.post('/ai/summarize-issue', { issueId, projectId });
                      setAiSummary(res.data.data.summary);
                    } catch (err) {
                      alert('Failed to summarize issue');
                    } finally {
                      setIsSummarizing(false);
                    }
                  }}
                  className="secondary-button"
                  style={{ fontSize: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  disabled={isSummarizing}
                >
                  ✨ {isSummarizing ? 'Summarizing...' : 'Summarize Thread'}
                </button>
              </div>
              {aiSummary && (
                <div data-color-mode="dark" style={{ marginTop: '12px', padding: '16px', backgroundColor: 'rgba(101, 84, 192, 0.1)', borderLeft: '4px solid #6554c0', borderRadius: '4px' }}>
                  <MDEditor.Markdown source={aiSummary} style={{ backgroundColor: 'transparent' }} />
                </div>
              )}
            </div>

            {issue.type === 'EPIC' && issue.epicIssues && (
              <div style={{ marginBottom: '32px' }}>
                <h3 className="sidebar-label">Epic Progress</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#ebecf0', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    {(() => {
                      const total = issue.epicIssues.length || 1;
                      const done = issue.epicIssues.filter((i: any) => i.status === 'DONE').length;
                      const inProgress = issue.epicIssues.filter((i: any) => i.status === 'IN_PROGRESS').length;
                      const todo = issue.epicIssues.filter((i: any) => i.status === 'TO_DO').length;
                      return (
                        <>
                          <div style={{ width: `${(done / total) * 100}%`, backgroundColor: '#36b37e' }} title={`Done: ${done}`} />
                          <div style={{ width: `${(inProgress / total) * 100}%`, backgroundColor: '#0052cc' }} title={`In Progress: ${inProgress}`} />
                          <div style={{ width: `${(todo / total) * 100}%`, backgroundColor: '#dfe1e6' }} title={`To Do: ${todo}`} />
                        </>
                      );
                    })()}
                  </div>
                  <span style={{ fontSize: '12px', color: '#5e6c84' }}>
                    {Math.round((issue.epicIssues.filter((i: any) => i.status === 'DONE').length / (issue.epicIssues.length || 1)) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {issue.type !== 'SUB_TASK' && (
              <div style={{ marginBottom: '32px' }}>
                <h3 className="sidebar-label">Sub-tasks</h3>
                {issue.subtasks && issue.subtasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {issue.subtasks.map((subtask: any) => (
                      <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f4f5f7', borderRadius: '4px', border: '1px solid #dfe1e6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px' }}>🟦</span>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#5e6c84' }}>{subtask.key}</span>
                          <span style={{ fontSize: '14px' }}>{subtask.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 6px', borderRadius: '3px', backgroundColor: '#ebecf0' }}>{subtask.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {userRole !== 'VIEWER' && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (newSubtaskTitle.trim()) {
                      createSubtaskMutation.mutate(newSubtaskTitle);
                    }
                  }} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="What needs to be done?" 
                      className="form-input" 
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '2px solid transparent', backgroundColor: '#f4f5f7' }}
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      disabled={createSubtaskMutation.isPending}
                    />
                    <button type="submit" className="primary-button" disabled={!newSubtaskTitle.trim() || createSubtaskMutation.isPending}>
                      Add
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="activity-feed">
              <h3 className="sidebar-label" style={{ fontSize: '1rem', marginBottom: '16px' }}>Activity</h3>
              
              {timeline.map((item) => {
                if (item._timelineType === 'COMMENT') {
                  return (
                    <CommentSection 
                      key={item.id} 
                      comment={item} 
                      currentUser={user}
                      userRole={userRole}
                      onUpdate={(text) => updateCommentMutation.mutate({ commentId: item.id, text })}
                      onDelete={() => deleteCommentMutation.mutate(item.id)}
                    />
                  );
                } else {
                  return <ActivityFeed key={item.id} activity={item} />;
                }
              })}

              {userRole !== 'VIEWER' && (
                <div className="comment-input-area">
                  <h4 className="sidebar-label">Add a comment</h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (commentText.trim()) {
                      createCommentMutation.mutate({ text: commentText, mentionedUserIds });
                    }
                  }}>
                    <MentionTextarea 
                      value={commentText}
                      onChange={setCommentText}
                      onMention={(userId) => {
                        if (!mentionedUserIds.includes(userId)) {
                          setMentionedUserIds([...mentionedUserIds, userId]);
                        }
                      }}
                      members={membersRes || []}
                      className="comment-textarea" 
                      placeholder="Add a comment... (Type @ to mention)"
                      disabled={createCommentMutation.isPending}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button 
                        type="submit" 
                        className="primary-button"
                        disabled={createCommentMutation.isPending}
                      >
                        {createCommentMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="modal-content-right">
            <div className="sidebar-section">
              <div className="sidebar-label">Status</div>
              <div className="sidebar-value">{issue.status}</div>
            </div>
            
            <div className="sidebar-section">
              <div className="sidebar-label">Assignee</div>
              <div className="sidebar-value">
                {userRole !== 'VIEWER' ? (
                  <select
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                    value={issue.assignee?.id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateIssueMutation.mutate({ assigneeId: val || null });
                    }}
                    disabled={updateIssueMutation.isPending}
                  >
                    <option value="">Unassigned</option>
                    {(membersRes || []).map((m: any) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  issue.assignee ? (
                    <>
                      <div className="timeline-avatar" style={{ width: '24px', height: '24px', fontSize: '0.65rem' }}>
                        {issue.assignee.name.charAt(0).toUpperCase()}
                      </div>
                      {issue.assignee.name}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>
                  )
                )}
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-label">Reporter</div>
              <div className="sidebar-value">
                {issue.reporter?.name || 'Unknown'}
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-label">Priority</div>
              <div className="sidebar-value">{issue.priority}</div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-label">Points</div>
              <div className="sidebar-value">{issue.points || '--'}</div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-label">Created</div>
              <div className="sidebar-value" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(issue.createdAt).toLocaleString()}
              </div>
            </div>
            
            <div className="sidebar-section">
              <div className="sidebar-label">Updated</div>
              <div className="sidebar-value" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(issue.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
