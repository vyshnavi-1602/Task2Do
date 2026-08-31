import React, { useState, useRef, useEffect } from 'react';

export interface WorkspaceMember {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  role: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (val: string) => void;
  onMention: (userId: string) => void;
  members: WorkspaceMember[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
}

export function MentionTextarea({
  value, onChange, onMention, members, disabled, className, placeholder, style, autoFocus
}: MentionTextareaProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const pos = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, pos);
    
    // Find if we are currently typing a mention
    const match = textBeforeCursor.match(/(?:\s|^)@(\w*)$/);
    if (match) {
      setSearchQuery(match[1].toLowerCase());
      setMentionStartIndex(pos - match[1].length - 1);
      setShowDropdown(true);
      // Rough position approximation
      setCursorPosition({ top: 30, left: 10 }); 
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = (member: WorkspaceMember) => {
    if (mentionStartIndex !== null && textareaRef.current) {
      const before = value.slice(0, mentionStartIndex);
      const after = value.slice(textareaRef.current.selectionStart);
      const newValue = `${before}@${member.user.name.replace(/\s+/g, '_')} ${after}`;
      
      onChange(newValue);
      onMention(member.user.id);
      
      setShowDropdown(false);
      textareaRef.current.focus();
    }
  };

  const filteredMembers = members.filter(m => 
    m.user.name.toLowerCase().includes(searchQuery)
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={className}
        placeholder={placeholder}
        style={style}
        autoFocus={autoFocus}
      />
      {showDropdown && filteredMembers.length > 0 && (
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: cursorPosition?.top ? `${cursorPosition.top}px` : '100%',
            left: cursorPosition?.left ? `${cursorPosition.left}px` : 0,
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            width: '250px'
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
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                backgroundColor: 'var(--primary-color)', color: 'white',
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
