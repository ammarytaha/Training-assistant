import { useState } from 'react';

// Editor for a single skill progression (coach-side). Full step CRUD:
// add, remove, reorder, edit name/detail.
export default function SkillForm({ initial, onSave, onCancel, saving, submitLabel = 'Save skill' }) {
  const [name, setName] = useState(initial?.name || '');
  const [group, setGroup] = useState(initial?.group || '');
  const [icon, setIcon] = useState(initial?.icon || '🎯');
  const [blurb, setBlurb] = useState(initial?.blurb || '');
  const [steps, setSteps] = useState(() => (initial?.steps || []).map((s) => ({ ...s })));

  function addStep() {
    setSteps((p) => [...p, { name: '', detail: '' }]);
  }
  function removeStep(i) {
    setSteps((p) => p.filter((_, j) => j !== i));
  }
  function move(i, dir) {
    setSteps((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const c = [...p];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  }
  function update(i, field, val) {
    setSteps((p) => p.map((s, j) => (j === i ? { ...s, [field]: val } : s)));
  }

  function submit() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      group: group.trim(),
      icon: icon.trim() || '🎯',
      blurb: blurb.trim(),
      steps: steps.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), detail: (s.detail || '').trim() })),
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[64px_1fr] gap-2">
        <div>
          <label className="label">Icon</label>
          <input className="field !py-2.5 !text-center" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
        </div>
        <div>
          <label className="label">Skill name</label>
          <input className="field !py-2.5 !text-sm" placeholder="e.g. Pull-up → Muscle-up" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Group / focus</label>
        <input className="field !py-2.5 !text-sm" placeholder="Pull / Push / Balance…" value={group} onChange={(e) => setGroup(e.target.value)} />
      </div>
      <div>
        <label className="label">Short description</label>
        <input className="field !py-2.5 !text-sm" placeholder="One line about the goal" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label !mb-0">Steps (in order)</label>
          <button onClick={addStep} className="text-xs font-bold text-accent">+ Add step</button>
        </div>
        {steps.length === 0 && <p className="text-xs text-text-dim italic py-3 text-center">No steps yet. Add the first progression.</p>}
        <div className="space-y-2.5">
          {steps.map((s, i) => (
            <div key={i} className="border border-border rounded-lg p-3 bg-surface-2/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 shrink-0 rounded-full bg-surface-2 border border-border-strong grid place-items-center text-[11px] font-bold text-text-mid">{i + 1}</span>
                <input className="field !py-2 !text-sm font-semibold flex-1" placeholder="Step name" value={s.name} onChange={(e) => update(i, 'name', e.target.value)} />
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-text-mid disabled:opacity-30 px-1">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="text-text-mid disabled:opacity-30 px-1">↓</button>
                <button onClick={() => removeStep(i)} className="text-danger px-1">✕</button>
              </div>
              <textarea rows={2} className="field !py-2 !text-sm resize-none" placeholder="Detail / cue (optional)" value={s.detail || ''} onChange={(e) => update(i, 'detail', e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button onClick={onCancel} className="flex-1 py-3 border border-border-strong rounded-lg text-sm font-semibold text-text-mid hover:text-text">Cancel</button>
        )}
        <button onClick={submit} disabled={saving || !name.trim()} className="flex-1 btn-accent !py-3">
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
