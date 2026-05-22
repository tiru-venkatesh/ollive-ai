import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sdk } from '../lib/sdk';

export default function Chat({ resumeSessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [provider, setProvider] = useState('groq');
  const [streaming, setStreaming] = useState(true);
  const [latency, setLatency] = useState(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (resumeSessionId) {
      setSessionId(resumeSessionId);
      loadHistory(resumeSessionId);
    } else {
      setSessionId(uuidv4());
      setMessages([]);
    }
  }, [resumeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async (sid) => {
    const history = await sdk.getConversation(sid);
    setMessages(history.map(m => ({ role: m.role, content: m.content })));
  };

  const sendStreaming = async (userMessage, sid) => {
    const start = Date.now();

    // Add empty assistant message to update in place
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, sessionId: sid }),
      signal: controller.signal,
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const { delta, error } = JSON.parse(data);
          if (error) throw new Error(error);
          if (delta) {
            fullText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: true };
              return updated;
            });
          }
        } catch {}
      }
    }

    // Mark streaming done
    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = { role: 'assistant', content: fullText };
      return updated;
    });
    setLatency(Date.now() - start);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      if (streaming && provider === 'groq') {
        await sendStreaming(userMessage, sessionId);
      } else {
        sdk.setProvider(provider);
        const start = Date.now();
        const result = await sdk.sendMessage({ message: userMessage, sessionId });
        if (result.status === 'error') {
          setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${result.error}`, error: true }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
          setLatency(Date.now() - start);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}`, error: true }]);
      }
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const newChat = () => {
    abortRef.current?.abort();
    setSessionId(uuidv4());
    setMessages([]);
    setLatency(null);
    setLoading(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-toolbar">
        <div className="session-info">
          <span className="session-id">Session: {sessionId?.slice(0, 8)}...</span>
          {latency && <span className="latency">⚡ {latency}ms</span>}
        </div>
        <div className="toolbar-right">
          <label className="stream-toggle">
            <input type="checkbox" checked={streaming} onChange={e => setStreaming(e.target.checked)} />
            Stream
          </label>
          <select value={provider} onChange={e => setProvider(e.target.value)} className="provider-select">
            <option value="groq">Groq (Llama 3.1)</option>
          </select>
          <button onClick={newChat} className="btn-secondary">+ New Chat</button>
        </div>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>👋 Start a conversation</p>
            <p className="hint">Using {provider === 'groq' ? 'Groq / Llama 3.1' : 'Google Gemini'} {streaming && provider === 'groq' ? '· Streaming ✨' : ''}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role} ${msg.error ? 'error' : ''}`}>
            <span className="role-label">
              {msg.role === 'user' ? 'You' : '🤖 Assistant'}
              {msg.streaming && <span className="streaming-indicator"> ●</span>}
            </span>
            <p>{msg.content}</p>
          </div>
        ))}
        {loading && !streaming && (
          <div className="message assistant loading">
            <span className="role-label">🤖 Assistant</span>
            <p className="typing">Thinking...</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          rows={2}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-send">
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}