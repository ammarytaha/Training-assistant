import { useState } from 'react';

// Reusable editor for a workout (template OR a scheduled day). Full exercise
// CRUD: add, remove, reorder, edit name/reps/sets/info/video. Calls onSave with
// the assembled workout object.
export default function WorkoutEditor({ initial, onSave, onCancel, saving, submitLabel = 'Save' }) {
  const [name, setName] = useState(initial?.name || '');
  const [tag, setTag] = useState(initial?.tag || '');
  const [isSuperset, setIsSuperset] = useState(Boolean(initial?.isSuperset));
  const [rounds, setRounds] = useState(initial?.rounds || 6);
  const [exercises, setExercises] = useState(() =>
    (initial?.exercises || []).map((e) => ({ ...e, key: e.key || genKey() }))
  );

  function genKey() {
    return `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function addExercise() {
    setExercises((prev) => [...prev, { key: genKey(), name: '', reps: '', sets: 3, info: '', videoUrl: '' }]);
  }
  function removeExercise(key) {
    setExercises((prev) => prev.filter((e) => e.key !== key));
  }
  function move(key, dir) {
    setExercises((prev) => {
      const i = prev.findIndex((e) => e.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function update(key, field, value) {
    setExercises((prev) => prev.map((e) => (e.key === key ? { ...e, [field]: field === 'sets' ? Number(value) : value } : e)));
  }

  function submit() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), tag: tag.trim(), isSuperset, rounds: Number(rounds) || 0, exercises });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Workout name</label>
        <input className="field" placeholder="e.g. Pull A" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Tag / focus</label>
          <input className="field !py-2.5 !text-sm" placeholder="Vertical Pull" value={tag} onChange={(e) => setTag(e.target.value)} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-text-mid cursor-pointer pb-3">
            <input type="checkbox" className="accent-accent w-4 h-4" checked={isSuperset} onChange={(e) => setIsSuperset(e.target.checked)} />
            Superset circuit
          </label>
        </div>
      </div>

      {isSuperset && (
        <div>
          <label className="label">Rounds</label>
          <input
            type="number"
            min="1"
            max="20"
            className="field !py-2.5 !text-sm w-28"
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label !mb-0">Exercises</label>
          <button onClick={addExercise} className="text-xs font-bold text-accent">+ Add exercise</button>
        </div>
        {exercises.length === 0 && (
          <p className="text-xs text-text-dim italic py-3 text-center">No exercises yet. Add one above.</p>
        )}
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={ex.key} className="border border-border rounded-lg p-3 bg-surface-2/30">
              <div className="flex items-center gap-2 mb-2">
                <input
                  className="field !py-2 !text-sm font-semibold flex-1"
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={(e) => update(ex.key, 'name', e.target.value)}
                />
                <button onClick={() => move(ex.key, -1)} disabled={i === 0} className="text-text-mid disabled:opacity-30 px-1">↑</button>
                <button onClick={() => move(ex.key, 1)} disabled={i === exercises.length - 1} className="text-text-mid disabled:opacity-30 px-1">↓</button>
                <button onClick={() => removeExercise(ex.key)} className="text-danger px-1">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  className="field !py-2 !text-sm"
                  placeholder="Reps / time (e.g. 5 reps)"
                  value={ex.reps}
                  onChange={(e) => update(ex.key, 'reps', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="30"
                  className="field !py-2 !text-sm"
                  placeholder="Sets"
                  value={ex.sets}
                  onChange={(e) => update(ex.key, 'sets', e.target.value)}
                />
              </div>
              <input
                className="field !py-2 !text-sm mb-2"
                placeholder="YouTube video URL (optional)"
                value={ex.videoUrl || ''}
                onChange={(e) => update(ex.key, 'videoUrl', e.target.value)}
              />
              <textarea
                rows={2}
                className="field !py-2 !text-sm resize-none"
                placeholder="Form notes / cues (optional)"
                value={ex.info || ''}
                onChange={(e) => update(ex.key, 'info', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button onClick={onCancel} className="flex-1 py-3 border border-border-strong rounded-lg text-sm font-semibold text-text-mid hover:text-text">
            Cancel
          </button>
        )}
        <button onClick={submit} disabled={saving || !name.trim()} className="flex-1 btn-accent !py-3">
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
