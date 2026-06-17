import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

// Slide-up AI coach chat. Talks to POST /api/chat (Gemini via the backend).
export default function AIChat({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  // Load history the first time the panel opens.
  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      try {
        const data = await api.get('/api/chat');
        setMessages(data.messages || []);
      } catch {
        /* start empty */
      } finally {
        setLoaded(true);
      }
    })();
  }, [open, loaded]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError('');
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setSending(true);
    try {
      const data = await api.post('/api/chat', { message: text });
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur-sm">
      <div className="w-full max-w-app mx-auto flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-extrabold text-lg leading-none">AI Coach</div>
            <div className="text-xs text-text-mid mt-1">Powered by Gemini · knows your plan</div>
          </div>
          <button onClick={onClose} className="text-text-mid hover:text-text text-sm font-semibold px-3 py-2">
            Close ✕
          </button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-text-dim text-sm py-10">
              Ask me anything about your training — form, progressions, why you might be stuck, or whether to
              rest today.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-accent text-bg font-medium'
                    : 'bg-surface border border-border text-text'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl px-4 py-3">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-text-mid rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-text-mid rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-text-mid rounded-full animate-bounce" />
                </span>
              </div>
            </div>
          )}
          {error && <div className="text-center text-danger text-xs">{error}</div>}
        </div>

        {/* Input */}
        <form onSubmit={send} className="px-5 py-4 border-t border-border flex gap-2">
          <input
            className="field"
            placeholder="Ask your coach…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-accent text-bg font-extrabold rounded-lg px-5 disabled:bg-surface-2 disabled:text-text-dim"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
