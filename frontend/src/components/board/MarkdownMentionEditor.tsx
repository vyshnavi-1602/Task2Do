import { useState, useRef, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { WorkspaceMember } from './MentionTextarea';
import { useTheme } from '../../context/ThemeContext';

interface MarkdownMentionEditorProps {
  value: string;
  onChange: (val: string) => void;
  onMention: (userId: string) => void;
  members: WorkspaceMember[];
  disabled?: boolean;
}

export function MarkdownMentionEditor({
  value, onChange, onMention, members, disabled
}: MarkdownMentionEditorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const { theme } = useTheme();
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (newValue: string = '') => {
    onChange(newValue);

    // Rough heuristic since we don't have exact cursor selectionStart from MDEditor easily 
    // without hacking into its internal textarea refs.
    // We look for the last typed "@" sequence in the entire text. 
    // This is a simplification but works for basic usage.
    const match = newValue.match(/(?:\s|^)@(\w*)$/);
    
    if (match && match.index !== undefined) {
      setSearchQuery(match[1].toLowerCase());
      setMentionStartIndex(match.index + (match[0].startsWith(' ') || match[0].startsWith('\n') ? 1 : 0));
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = (member: WorkspaceMember) => {
    if (mentionStartIndex !== null) {
      const before = value.slice(0, mentionStartIndex);
      // We assume the cursor is at the end of the text for now
      const after = value.slice(mentionStartIndex + searchQuery.length + 1);
      const newValue = `${before}@${member.user.name.replace(/\s+/g, '_')} ${after}`;
      
      onChange(newValue);
      onMention(member.user.id);
      
      setShowDropdown(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.user.name.toLowerCase().includes(searchQuery)
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} data-color-mode={theme}>
      <MDEditor
        value={value}
        onChange={handleTextChange}
        preview="edit"
        height={150}
        textareaProps={{
          disabled
        }}
      />
      {showDropdown && filteredMembers.length > 0 && (
        <div 
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            width: '250px',
            marginBottom: '8px'
          }}
        >
          {filteredMembers.map(m => (
            <div 
              key={m.user.id}
              onClick={() => handleSelect(m)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                backgroundColor: 'var(--accent-color)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem'
              }}>
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.9rem' }}>{m.user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
