import { useEffect, useState } from 'react';
import { api } from '../api';

// Shows the coach's reusable invite link with copy + regenerate controls.
export default function InviteModal({ onClose }) {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function load() {
    try {
      const d = await api.get('/api/coach/invite');
      setInvite(d.invite);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked; user can select manually */
    }
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const d = await api.post('/api/coach/invite/regenerate', {});
      setInvite(d.invite);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/70 backdrop-blur" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-extrabold">Invite a client</h2>
          <button onClick={onClose} className="text-text-mid text-sm">Close ✕</button>
        </div>
        <p className="text-xs text-text-mid mb-4">
          Share this link with a client. When they sign up through it — with email or Google — they're
          automatically added as your trainee.
        </p>

        {loading ? (
          <div className="text-text-dim text-xs font-mono animate-pulse py-8 text-center">loading…</div>
        ) : (
          <>
            <label className="label">Your invite link</label>
            <div className="flex gap-2 mb-3">
              <input readOnly value={invite?.url || ''} onFocus={(e) => e.target.select()} className="field !py-2.5 !text-sm flex-1 font-mono" />
              <button onClick={copy} className="bg-accent text-bg font-bold rounded-lg px-4 text-sm whitespace-nowrap">
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-dim">Used {invite?.usedCount || 0} time{invite?.usedCount === 1 ? '' : 's'}</span>
              <button onClick={regenerate} disabled={regenerating} className="text-xs font-semibold text-warm hover:underline disabled:opacity-50">
                {regenerating ? 'Regenerating…' : '↻ Regenerate link'}
              </button>
            </div>
            <p className="text-[11px] text-text-dim mt-2">Regenerating disables the old link.</p>
          </>
        )}
      </div>
    </div>
  );
}
