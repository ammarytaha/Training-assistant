import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatDate, todayISO } from '../lib/date';

// Bodyweight tracker: an inline SVG line chart (no chart library) + a quick-log
// input. Strength-to-weight ratio matters in calisthenics, so this is a
// first-class metric.
export default function BodyweightChart() {
  const [log, setLog] = useState([]);
  const [kg, setKg] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/profile/bodyweight');
        setLog(data.log || []);
      } catch {
        /* empty */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function add(e) {
    e.preventDefault();
    const value = parseFloat(kg);
    if (!value || saving) return;
    setError('');
    setSaving(true);
    try {
      const data = await api.post('/api/profile/bodyweight', { kg: value });
      setLog(data.log);
      setKg('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const stats = useMemo(() => {
    if (log.length === 0) return null;
    const latest = log[log.length - 1];
    const first = log[0];
    const delta = Math.round((latest.kg - first.kg) * 10) / 10;
    return { latest, delta, count: log.length };
  }, [log]);

  // Build an SVG polyline scaled to the data range.
  const chart = useMemo(() => {
    if (log.length < 2) return null;
    const W = 300;
    const H = 120;
    const pad = 8;
    const xs = log.map((_, i) => i);
    const ys = log.map((e) => e.kg);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeY = maxY - minY || 1;
    const points = log.map((e, i) => {
      const x = pad + (i / (xs.length - 1)) * (W - pad * 2);
      const y = pad + (1 - (e.kg - minY) / rangeY) * (H - pad * 2);
      return [x, y];
    });
    const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${pad},${H - pad} ${line} ${W - pad},${H - pad}`;
    return { W, H, line, area, points, minY, maxY };
  }, [log]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[11px] uppercase tracking-widest text-text-mid">Bodyweight</div>
        {stats && (
          <div className="font-mono text-sm">
            <span className="text-text font-bold">{stats.latest.kg} kg</span>
            {stats.count > 1 && (
              <span className={`ml-2 ${stats.delta <= 0 ? 'text-accent' : 'text-warm'}`}>
                {stats.delta >= 0 ? '+' : ''}
                {stats.delta}
              </span>
            )}
          </div>
        )}
      </div>

      {!loaded ? (
        <div className="h-28 grid place-items-center text-text-dim text-xs font-mono animate-pulse">loading…</div>
      ) : chart ? (
        <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full h-28" preserveAspectRatio="none">
          <polygon points={chart.area} fill="rgba(215,255,80,0.08)" />
          <polyline points={chart.line} fill="none" stroke="#D7FF50" strokeWidth="2" strokeLinejoin="round" />
          {chart.points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#D7FF50" />
          ))}
        </svg>
      ) : (
        <div className="h-28 grid place-items-center text-text-dim text-xs text-center px-4">
          {log.length === 1
            ? `Logged ${log[0].kg} kg on ${formatDate(log[0].date)}. Add another to see the trend.`
            : 'Log your weight to start tracking the trend.'}
        </div>
      )}

      <form onSubmit={add} className="flex gap-2 mt-3">
        <input
          type="number"
          step="0.1"
          min="20"
          max="400"
          className="field !py-2.5"
          placeholder={`Today's weight (kg) — ${formatDate(todayISO())}`}
          value={kg}
          onChange={(e) => setKg(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving || !kg}
          className="bg-accent text-bg font-extrabold rounded-lg px-5 disabled:bg-surface-2 disabled:text-text-dim"
        >
          Log
        </button>
      </form>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
