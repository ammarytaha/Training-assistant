import { useMemo, useState } from 'react';
import { api } from '../api';
import { formatDate } from '../lib/date';
import ExerciseModal from './ExerciseModal';

// Pull the first number out of a prescribed string ("5 reps" -> "5", "30 sec" -> "30").
function defaultReps(ex) {
  const m = String(ex.reps || '').match(/\d+/);
  return m ? m[0] : '';
}

// Renders ONE scheduled workout for a given date and logs the finished session.
// Trainees record the actual reps they hit per set (prefilled with the
// prescribed target), which feeds the per-exercise progress history.
// `readOnly` (future dates) shows the plan without logging.
export default function WorkoutTracker({ workout, date, readOnly = false, onBack, onFinished }) {
  const [info, setInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reps, setReps] = useState({}); // { exKey: { setIndex: repsValue } }
  const [round, setRound] = useState(0);

  const totalSets = useMemo(() => {
    if (workout.isSuperset) return workout.rounds;
    return workout.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  }, [workout]);

  const doneSets = useMemo(() => {
    if (workout.isSuperset) return round;
    let n = 0;
    for (const ex of workout.exercises) {
      const r = reps[ex.key] || {};
      for (let i = 0; i < (ex.sets || 0); i++) if (Number(r[i]) > 0) n++;
    }
    return n;
  }, [workout, reps, round]);

  function setRep(exKey, i, val) {
    setReps((p) => ({ ...p, [exKey]: { ...(p[exKey] || {}), [i]: val } }));
  }
  function toggleSet(ex, i) {
    const cur = reps[ex.key]?.[i];
    const isDone = cur !== undefined && cur !== '' && Number(cur) > 0;
    setRep(ex.key, i, isDone ? '' : defaultReps(ex));
  }

  async function finish() {
    if (doneSets === 0 || saving || readOnly) return;
    setSaving(true);

    // Build the per-exercise record the history view reads.
    let perExercise;
    if (workout.isSuperset) {
      perExercise = { rounds: round };
    } else {
      perExercise = {};
      for (const ex of workout.exercises) {
        const r = reps[ex.key] || {};
        const arr = [];
        for (let i = 0; i < (ex.sets || 0); i++) {
          const v = Number(r[i]);
          if (v > 0) arr.push(v);
        }
        perExercise[ex.key] = { name: ex.name, prescribed: ex.reps || '', reps: arr };
      }
    }

    try {
      await api.post('/api/sessions', {
        date,
        name: workout.name,
        scheduledWorkoutId: workout._id,
        setsCompleted: doneSets,
        setsTotal: totalSets,
        perExercise,
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
                <div className="space-y-1.5">
                  {Array.from({ length: ex.sets }, (_, i) => {
                    const val = reps[ex.key]?.[i] ?? '';
                    const done = Number(val) > 0;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 rounded-md border px-2.5 py-2 transition-colors ${
                          done ? 'border-accent bg-accent/5' : 'border-border-strong'
                        }`}
                      >
                        <button
                          onClick={() => toggleSet(ex, i)}
                          disabled={readOnly}
                          className={`w-7 h-7 shrink-0 rounded grid place-items-center text-xs font-bold disabled:opacity-50 ${
                            done ? 'bg-accent text-bg' : 'border border-border-strong text-text-dim'
                          }`}
                        >
                          {done ? '✓' : i + 1}
                        </button>
                        <span className="text-xs text-text-mid">Set {i + 1}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          disabled={readOnly}
                          value={val}
                          onChange={(e) => setRep(ex.key, i, e.target.value)}
                          placeholder={defaultReps(ex)}
                          className="ml-auto w-16 field !py-1.5 !text-sm text-center disabled:opacity-50"
                        />
                        <span className="text-xs text-text-dim w-8">reps</span>
                      </div>
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
