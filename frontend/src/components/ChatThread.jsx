import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

// A coach <-> trainee conversation. `otherId` is the person on the other side
// (the coach's id for a trainee, or the trainee's id for a coach). Polls every
// few seconds so both sides see new messages without a refresh.
export default function ChatThread({ otherId, title }) {
  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function load() {
    try {
      const d = await api.get(`/api/messages/thread/${otherId}`);
      setMe(d.me);
      setMessages(d.messages);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    if (!otherId) {
      setLoaded(true);
      return undefined;
    }
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const d = await api.post(`/api/messages/thread/${otherId}`, { text: body });
      setMessages((m) => [...m, d.message]);
      setText('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!otherId) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-dim text-sm italic">
        You haven't been linked to a coach yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh] bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border font-bold text-sm">{title}</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!loaded ? (
          <div className="text-text-dim text-xs font-mono animate-pulse text-center py-8">loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-text-dim text-sm italic text-center py-8">No messages yet. Say hello 👋</div>
        ) : (
          messages.map((m) => {
            const mine = m.sender === me;
            return (
              <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                    mine ? 'bg-accent text-bg rounded-br-sm' : 'bg-surface-2 text-text rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {error && loaded && <div className="text-danger text-xs px-3 py-1.5">{error}</div>}
      <form onSubmit={send} className="p-2.5 border-t border-border flex gap-2">
        <input
          className="field !py-2.5 !text-sm flex-1"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" disabled={sending || !text.trim()} className="bg-accent text-bg font-bold rounded-lg px-4 text-sm disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  );
}
