import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Coach notification bell: polls for new alerts, shows an unread badge, and a
// dropdown feed. Opening it marks everything read.
export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  async function load() {
    try {
      const d = await api.get('/api/notifications');
      setItems(d.notifications);
      setUnread(d.unread);
    } catch {
      /* ignore polling errors */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await api.post('/api/notifications/read', {});
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative w-9 h-9 grid place-items-center rounded-full bg-surface-2 border border-border-strong text-text-mid hover:text-text"
        aria-label="Notifications"
      >
        <span className="text-base leading-none">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-warm text-bg text-[10px] font-bold grid place-items-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface border border-border-strong rounded-xl shadow-xl z-50 p-2">
          <div className="text-[11px] uppercase tracking-widest text-text-mid px-2 py-2">Notifications</div>
          {items.length === 0 ? (
            <div className="text-text-dim text-sm italic text-center py-8">Nothing yet.</div>
          ) : (
            items.map((n) => (
              <div key={n._id} className={`px-3 py-2.5 rounded-lg ${n.read ? '' : 'bg-surface-2/50'}`}>
                <p className="text-sm leading-snug">{n.text}</p>
                <div className="text-[11px] text-text-dim mt-0.5 font-mono">{timeAgo(n.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
