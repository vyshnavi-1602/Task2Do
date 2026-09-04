import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { MarkdownMentionEditor } from './MarkdownMentionEditor';
import { useTheme } from '../../context/ThemeContext';

interface CommentProps {
  comment: {
    id: string;
    text: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
  };
  currentUser: any;
  userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
  members?: any[];
  onUpdate: (text: string) => void;
  onDelete: () => void;
}

export function CommentSection({ comment, currentUser, userRole, onUpdate, onDelete }: CommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.text);
  const { theme } = useTheme();

  const isAuthor = currentUser?.id === comment.author.id;
  const canEdit = isAuthor && userRole !== 'VIEWER';
  const canDelete = (isAuthor && userRole !== 'VIEWER') || userRole === 'ADMIN';

  const handleSave = () => {
    if (editValue.trim() && editValue !== comment.text) {
      onUpdate(editValue);
    }
    setIsEditing(false);
  };

  return (
    <div className="timeline-item">
      <div className="timeline-avatar">
        {comment.author.name.charAt(0).toUpperCase()}
      </div>
      <div className="timeline-content">
        <div className="timeline-header">
          <span className="timeline-author">{comment.author.name}</span>
          <span className="timeline-time">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        
        {isEditing ? (
          <div style={{ marginTop: '8px' }}>
            <MarkdownMentionEditor
              value={editValue}
              onChange={setEditValue}
              onMention={() => {}} // Mentions aren't actively notified on edits right now, but could be
              members={[]} // In edit mode, we could pass members if we wanted to support new mentions during edit. 
                           // For now we'll pass empty array to satisfy props.
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="primary-button" onClick={handleSave}>Save</button>
              <button 
                className="comment-action-btn" 
                style={{ padding: '8px' }} 
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(comment.text);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="timeline-body" data-color-mode={theme}>
            <MDEditor.Markdown source={comment.text} style={{ backgroundColor: 'transparent' }} />
          </div>
        )}

        {!isEditing && (canEdit || canDelete) && (
          <div className="comment-actions">
            {canEdit && (
              <button className="comment-action-btn" onClick={() => setIsEditing(true)}>Edit</button>
            )}
            {canDelete && (
              <button 
                className="comment-action-btn delete" 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this comment?')) {
                    onDelete();
                  }
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
