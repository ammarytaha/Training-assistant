import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatDate } from '../lib/date';

// Per-exercise rep history with PRs and a simple per-session bar trend.
// `endpoint` differs for trainee (own) vs coach (a trainee's) history.
export default function ExerciseHistory({ endpoint }) {
  const [exercises, setExercises] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get(endpoint);
        setExercises(d.exercises || []);
      } catch {
        /* ignore */
      } finally {
        setLoaded(true);
      }
    })();
  }, [endpoint]);

  if (!loaded) {
    return <div className="text-text-dim text-xs font-mono animate-pulse py-8 text-center">loading exercises…</div>;
  }
  if (exercises.length === 0) {
    return (
      <div className="text-text-dim text-sm italic text-center py-10">
        No exercise data yet. Once workouts are logged with reps, each exercise's history shows here.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {exercises.map((ex) => {
        const isOpen = open === ex.name;
        const recent = ex.entries.slice(-10);
        const max = Math.max(...ex.entries.map((e) => e.bestRep), 1);
        return (
          <div key={ex.name} className="bg-surface border border-border rounded-xl overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : ex.name)} className="w-full text-left p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-bold leading-tight">{ex.name}</div>
                <div className="text-xs text-text-mid mt-0.5">
                  {ex.sessions} session{ex.sessions > 1 ? 's' : ''} · last {formatDate(ex.lastDate)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-base font-bold text-accent">{ex.pr}</div>
                <div className="text-[10px] text-text-dim uppercase tracking-wide">PR reps</div>
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4">
                <div className="flex items-end gap-1 h-16 mb-3">
                  {recent.map((e, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-accent-dim rounded-t min-h-[2px]"
                      style={{ height: `${(e.bestRep / max) * 100}%` }}
                      title={`${formatDate(e.date)}: best ${e.bestRep}`}
                    />
                  ))}
                </div>
                <div className="space-y-0.5">
                  {[...ex.entries].reverse().slice(0, 10).map((e, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-border last:border-0 py-1.5">
                      <span className="font-mono text-text-mid">{formatDate(e.date)}</span>
                      <span className="text-text font-mono">{e.reps.join(' · ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
