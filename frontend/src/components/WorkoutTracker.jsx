import { useMemo, useState } from 'react';
import { api } from '../api';
import { formatDate } from '../lib/date';
import ExerciseModal from './ExerciseModal';

// Renders ONE scheduled workout for a given date and logs the finished session.
// `readOnly` (future dates) shows the plan without a finish button.
export default function WorkoutTracker({ workout, date, readOnly = false, onBack, onFinished }) {
  const [info, setInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sets, setSets] = useState({});
  const [round, setRound] = useState(0);

  const totalSets = useMemo(() => {
    if (workout.isSuperset) return workout.rounds;
    return workout.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  }, [workout]);

  const doneSets = useMemo(() => {
    if (workout.isSuperset) return round;
    return workout.exercises.reduce((sum, ex) => sum + (sets[ex.key] || 0), 0);
  }, [workout, sets, round]);

  function toggleSet(exKey, index) {
    setSets((prev) => {
      const current = prev[exKey] || 0;
      const next = index + 1 === current ? current - 1 : index + 1;
      return { ...prev, [exKey]: next };
    });
  }

  async function finish() {
    if (doneSets === 0 || saving || readOnly) return;
    setSaving(true);
    try {
      await api.post('/api/sessions', {
        date,
        name: workout.name,
        scheduledWorkoutId: workout._id,
        setsCompleted: doneSets,
        setsTotal: totalSets,
        perExercise: workout.isSuperset ? { rounds: round } : sets,
      });
      onFinished?.(doneSets >= totalSets);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="pb-28">
      <button onClick={onBack} className="text-text-mid hover:text-text text-sm py-2 mb-4 flex items-center gap-1.5">
        ← Back
      </button>

      <div className="mb-6 pb-4 border-b border-border">
        <div className="font-mono text-[11px] text-text-dim tracking-widest mb-1">{formatDate(date)}</div>
        <h1 className="text-4xl font-black tracking-tight leading-none mb-2">{workout.name}</h1>
        {workout.tag && <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">{workout.tag}</div>}
        {readOnly && <div className="mt-2 text-xs text-warm">Upcoming — preview only. Come back on the day to log it.</div>}
      </div>

      {workout.isSuperset ? (
        <Superset workout={workout} round={round} setRound={setRound} readOnly={readOnly} />
      ) : (
        <div className="space-y-2.5">
          {workout.exercises.map((ex) => (
            <div key={ex.key} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex justify-between items-start gap-2.5 mb-3.5">
                <div>
                  <div className="text-[17px] font-bold leading-tight">{ex.name}</div>
                  <div className="font-mono text-[11px] text-text-mid mt-1">
                    {ex.reps}
                    {ex.sets ? ` · ${ex.sets} SETS` : ''}
                  </div>
                </div>
                <button
                  onClick={() => setInfo(ex)}
                  className="w-7 h-7 shrink-0 rounded-full bg-surface-2 border border-border-strong text-text-mid italic font-serif font-bold hover:text-accent hover:border-accent"
                >
                  i
                </button>
              </div>
              {ex.sets > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: ex.sets }, (_, i) => {
                    const filled = i < (sets[ex.key] || 0);
                    return (
                      <button
                        key={i}
                        disabled={readOnly}
                        onClick={() => toggleSet(ex.key, i)}
                        className={`flex-1 min-w-[48px] h-11 rounded-md font-mono font-bold text-sm border-[1.5px] transition-colors disabled:opacity-50 ${
                          filled
                            ? 'bg-accent border-accent text-bg'
                            : 'bg-transparent border-border-strong text-text-dim hover:border-text-mid'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 max-w-app mx-auto px-5 pb-6 pt-4 bg-gradient-to-t from-bg via-bg/95 to-transparent">
          <div className="text-center font-mono text-[11px] text-text-mid mb-2.5 tracking-wide">
            {doneSets} / {totalSets} {workout.isSuperset ? 'rounds' : 'sets'} completed
          </div>
          <button onClick={finish} disabled={doneSets === 0 || saving} className="btn-accent">
            {saving ? 'Saving…' : doneSets >= totalSets ? 'Complete Workout ✓' : 'Finish Workout'}
          </button>
        </div>
      )}

      <ExerciseModal exercise={info} onClose={() => setInfo(null)} />
    </div>
  );
}

function Superset({ workout, round, setRound, readOnly }) {
  return (
    <>
      <div className="bg-surface border border-accent rounded-xl p-4 mb-4">
        <div className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-2">How it works</div>
        <p className="text-sm leading-relaxed">
          No rest between exercises within a round. Move straight through all {workout.exercises.length} exercises —
          that's one round. Complete {workout.rounds} rounds; keep rest between rounds short.
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-4">
        {Array.from({ length: workout.rounds }, (_, i) => (
          <div key={i} className={`w-8 h-1.5 rounded ${i < round ? 'bg-accent' : 'bg-surface-2 border border-border'}`} />
        ))}
      </div>

      <div className="space-y-1.5 mb-4">
        {workout.exercises.map((ex) => (
          <div key={ex.key} className="flex justify-between items-center bg-surface border border-border rounded-lg px-3.5 py-3">
            <div className="font-semibold text-sm">{ex.name}</div>
            <div className="font-mono text-xs text-accent font-bold">{ex.reps}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setRound((r) => Math.min(r + 1, workout.rounds))}
        disabled={readOnly || round >= workout.rounds}
        className="btn-accent disabled:opacity-40"
      >
        {round >= workout.rounds ? 'All Rounds Complete' : `Round Complete → (${round}/${workout.rounds})`}
      </button>
    </>
  );
}
