import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './ChatWidget.css';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: isAuthenticated 
        ? "Hi! I'm the Task2Do Assistant. I can help you with creating tasks, managing workspaces, or checking sprints. What would you like to know?"
        : "Welcome to Task2Do! I am the Task2Do Assistant. Feel free to ask me any questions about how our app works!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ prompt: userMessage.text })
      });
      
      if (!response.ok) throw new Error('Failed to connect to AI');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMessageId, role: 'bot', text: '' }]);
      
      let botText = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.text) {
                botText += data.text;
                setMessages(prev => prev.map(msg => 
                  msg.id === botMessageId ? { ...msg, text: botText } : msg
                ));
              }
            } catch (e) {
              // Ignore parse errors from incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: 'Sorry, I am having trouble connecting to the server.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-widget-window">
          <div className="chat-header">
            <span>Task2Do Assistant</span>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="chat-loading">
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            <form className="chat-input-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="chat-input"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" className="chat-send-btn" disabled={isLoading || !input.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button className="chat-widget-button" onClick={() => setIsOpen(true)}>
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
}
