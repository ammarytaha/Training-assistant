import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { api } from '../api';
import { formatDate, isoFor, todayISO } from '../lib/date';
import WorkoutEditor from '../components/WorkoutEditor';

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const [trainees, setTrainees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await api.get('/api/coach/trainees');
      setTrainees(data.trainees);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-text-mid font-mono text-sm animate-pulse">Loading…</div>;
  }

  if (selected) {
    return <TraineeManager trainee={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="max-w-app mx-auto px-4 sm:px-5 pt-5 pb-16">
      <header className="flex justify-between items-end mb-8 pb-4 border-b border-border">
        <div>
          <div className="font-black text-2xl tracking-tight leading-none">
            COACH<span className="text-warm">.</span>
          </div>
          <div className="text-xs text-text-mid mt-1">{user?.name}</div>
        </div>
        <button onClick={logout} className="text-xs text-text-dim hover:text-text">Log out</button>
      </header>

      <div className="text-[11px] uppercase tracking-widest text-text-mid mb-3">Your Trainees</div>
      {trainees.length === 0 ? (
        <div className="text-text-dim text-sm italic text-center py-10">
          No trainees assigned yet. When a trainee signs up and is linked to you, they'll appear here.
        </div>
      ) : (
        <div className="space-y-2.5">
          {trainees.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelected({ ...t, id: t._id })}
              className="w-full text-left bg-surface border border-border rounded-xl p-4 hover:border-border-strong flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-strong grid place-items-center font-bold text-accent">
                {t.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="font-bold">{t.name}</div>
                <div className="text-xs text-text-mid">{t.email}</div>
              </div>
              <span className="text-text-dim">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manager for one trainee: Calendar / Templates / Notes ──────────
function TraineeManager({ trainee, onBack }) {
  const [tab, setTab] = useState('calendar');
  const [templates, setTemplates] = useState([]);

  async function loadTemplates() {
    const data = await api.get('/api/coach/templates');
    setTemplates(data.templates);
  }
  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div className="max-w-app mx-auto px-4 sm:px-5 pt-5 pb-16">
      <button onClick={onBack} className="text-text-mid hover:text-text text-sm py-2 mb-3">← All trainees</button>
      <div className="mb-5 pb-4 border-b border-border">
        <h1 className="text-3xl font-black tracking-tight leading-none mb-1">{trainee.name}</h1>
        <div className="text-xs text-text-mid">{trainee.email}</div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 bg-surface border border-border rounded-lg p-1 mb-6">
        {[
          ['calendar', 'Calendar'],
          ['templates', 'Templates'],
          ['notes', 'Notes'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-2 rounded-md text-sm font-semibold ${tab === key ? 'bg-warm text-bg' : 'text-text-mid hover:text-text'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && <CalendarTab trainee={trainee} templates={templates} />}
      {tab === 'templates' && <TemplatesTab templates={templates} reload={loadTemplates} />}
      {tab === 'notes' && <NotesTab trainee={trainee} />}
    </div>
  );
}

// ─── Calendar tab ───────────────────────────────────────────────────
function CalendarTab({ trainee, templates }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [schedule, setSchedule] = useState([]);
  const [doneSet, setDoneSet] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showRepeat, setShowRepeat] = useState(false);

  const monthBounds = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return { from: isoFor(first), to: isoFor(last), first, last };
  }, [month]);

  async function load() {
    const data = await api.get(`/api/coach/trainees/${trainee.id}/schedule?from=${monthBounds.from}&to=${monthBounds.to}`);
    setSchedule(data.schedule);
    setDoneSet(new Set(data.sessions.map((s) => s.date)));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthBounds.from]);

  const byDate = useMemo(() => Object.fromEntries(schedule.map((w) => [w.date, w])), [schedule]);

  // Build the month grid (Sun-start).
  const cells = useMemo(() => {
    const startWeekday = monthBounds.first.getDay();
    const days = monthBounds.last.getDate();
    const arr = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(new Date(month.getFullYear(), month.getMonth(), d));
    return arr;
  }, [month, monthBounds]);

  const selectedWorkout = selectedDate ? byDate[selectedDate] : null;
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="text-text-mid hover:text-text px-2 py-1">‹ Prev</button>
        <div className="font-extrabold">{monthLabel}</div>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="text-text-mid hover:text-text px-2 py-1">Next ›</button>
      </div>

      <button onClick={() => setShowRepeat(true)} className="w-full mb-4 py-2.5 rounded-lg border border-warm/50 text-warm text-sm font-semibold hover:bg-warm/10">
        ↻ Fill month — repeat on weekdays
      </button>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] uppercase text-text-dim text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 mb-5">
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} />;
          const iso = isoFor(d);
          const w = byDate[iso];
          const done = doneSet.has(iso);
          const isToday = iso === todayISO();
          const isSel = iso === selectedDate;
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              className={`aspect-square rounded-md border p-1 flex flex-col items-center justify-start text-center overflow-hidden ${
                isSel ? 'border-warm' : done ? 'border-accent' : w ? 'border-accent/40' : 'border-border'
              } ${isToday ? 'bg-surface-2' : 'bg-surface'}`}
            >
              <span className={`font-mono text-[11px] ${done ? 'text-accent' : 'text-text'}`}>{d.getDate()}</span>
              {w && <span className="text-[7px] leading-tight text-text-mid line-clamp-2 mt-0.5">{w.name}</span>}
            </button>
          );
        })}
      </div>

      {/* Day editor */}
      {selectedDate && (
        <DayEditor
          trainee={trainee}
          date={selectedDate}
          workout={selectedWorkout}
          templates={templates}
          onClose={() => setSelectedDate(null)}
          onChanged={load}
        />
      )}

      {showRepeat && (
        <RepeatModal
          trainee={trainee}
          templates={templates}
          defaultFrom={monthBounds.from}
          defaultTo={monthBounds.to}
          onClose={() => setShowRepeat(false)}
          onDone={() => {
            setShowRepeat(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function DayEditor({ trainee, date, workout, templates, onClose, onChanged }) {
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'custom'
  const [templateId, setTemplateId] = useState(templates[0]?._id || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function assignTemplate() {
    if (!templateId) return;
    setSaving(true);
    setErr('');
    try {
      await api.post(`/api/coach/trainees/${trainee.id}/schedule`, { templateId, dates: [date] });
      await onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    setSaving(true);
    setErr('');
    try {
      await api.del(`/api/coach/schedule/${workout._id}`);
      await onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function saveEdit(data) {
    setSaving(true);
    setErr('');
    try {
      await api.put(`/api/coach/schedule/${workout._id}`, data);
      setMode('view');
      await onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function saveCustom(data) {
    setSaving(true);
    setErr('');
    try {
      await api.post(`/api/coach/trainees/${trainee.id}/schedule`, { workout: data, dates: [date] });
      setMode('view');
      await onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface border border-warm/50 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold">{formatDate(date)}</div>
        <button onClick={onClose} className="text-text-mid text-sm">Close ✕</button>
      </div>
      {err && <div className="mb-3 text-xs text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">{err}</div>}

      {mode === 'edit' && workout ? (
        <WorkoutEditor initial={workout} onSave={saveEdit} onCancel={() => setMode('view')} saving={saving} submitLabel="Save day" />
      ) : mode === 'custom' ? (
        <WorkoutEditor initial={{ exercises: [] }} onSave={saveCustom} onCancel={() => setMode('view')} saving={saving} submitLabel="Assign custom" />
      ) : workout ? (
        <div>
          <div className="text-xl font-extrabold">{workout.name}</div>
          {workout.tag && <div className="text-xs text-accent uppercase tracking-wide mb-2">{workout.tag}</div>}
          <div className="text-xs text-text-mid mb-3">{workout.exercises.map((e) => e.name).join(' · ')}</div>
          <div className="flex gap-2">
            <button onClick={() => setMode('edit')} className="flex-1 py-2.5 rounded-lg bg-surface-2 border border-border-strong text-sm font-semibold">Edit this day</button>
            <button onClick={remove} disabled={saving} className="py-2.5 px-4 rounded-lg border border-danger/50 text-danger text-sm font-semibold">Remove</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm text-text-mid mb-3">No workout scheduled. Assign one:</div>
          <div className="flex gap-2 mb-2">
            <select className="field !py-2.5 !text-sm flex-1" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            <button onClick={assignTemplate} disabled={saving || !templateId} className="bg-accent text-bg font-bold rounded-lg px-4 text-sm">Assign</button>
          </div>
          <button onClick={() => setMode('custom')} className="w-full py-2.5 rounded-lg border border-border-strong text-sm font-semibold text-text-mid hover:text-text">
            + Build a custom workout for this day
          </button>
        </div>
      )}
    </div>
  );
}

function RepeatModal({ trainee, templates, defaultFrom, defaultTo, onClose, onDone }) {
  const [templateId, setTemplateId] = useState(templates[0]?._id || '');
  const [weekdays, setWeekdays] = useState([1, 3, 5]); // Mon/Wed/Fri default
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function toggle(i) {
    setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  async function apply() {
    if (!templateId || weekdays.length === 0) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await api.post(`/api/coach/trainees/${trainee.id}/schedule`, { templateId, weekdays, from, to });
      setMsg(`Assigned to ${res.assigned} day(s).`);
      setTimeout(onDone, 700);
    } catch (err) {
      setMsg(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/70 backdrop-blur" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-extrabold mb-1">Repeat on weekdays</h2>
        <p className="text-xs text-text-mid mb-4">Pick a workout, the weekdays, and a date range. Every matching day gets assigned.</p>

        <label className="label">Workout</label>
        <select className="field !py-2.5 !text-sm mb-4" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        <label className="label">Weekdays</label>
        <div className="flex gap-1.5 mb-4">
          {labels.map((l, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`flex-1 py-2 rounded-md text-xs font-bold border ${
                weekdays.includes(i) ? 'bg-accent text-bg border-accent' : 'bg-surface-2 border-border text-text-mid'
              }`}
            >
              {l[0]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="label">From</label>
            <input type="date" className="field !py-2.5 !text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="field !py-2.5 !text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        {msg && <div className="text-xs text-accent mb-3">{msg}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-border-strong rounded-lg text-sm font-semibold text-text-mid">Cancel</button>
          <button onClick={apply} disabled={saving || !templateId || weekdays.length === 0} className="flex-1 btn-accent !py-3">
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Templates tab ──────────────────────────────────────────────────
function TemplatesTab({ templates, reload }) {
  const [editing, setEditing] = useState(null); // template object or 'new'
  const [saving, setSaving] = useState(false);

  async function save(data) {
    setSaving(true);
    try {
      if (editing === 'new') await api.post('/api/coach/templates', data);
      else await api.put(`/api/coach/templates/${editing._id}`, data);
      setEditing(null);
      await reload();
    } finally {
      setSaving(false);
    }
  }
  async function remove(id) {
    await api.del(`/api/coach/templates/${id}`);
    await reload();
  }

  if (editing) {
    return (
      <div>
        <div className="font-bold mb-3">{editing === 'new' ? 'New template' : `Edit: ${editing.name}`}</div>
        <WorkoutEditor
          initial={editing === 'new' ? { exercises: [] } : editing}
          onSave={save}
          onCancel={() => setEditing(null)}
          saving={saving}
          submitLabel="Save template"
        />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setEditing('new')} className="w-full mb-4 py-2.5 rounded-lg bg-accent text-bg font-bold text-sm">+ New template</button>
      <div className="space-y-2.5">
        {templates.map((t) => (
          <div key={t._id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-extrabold">{t.name}</div>
                {t.tag && <div className="text-[10px] uppercase tracking-wide text-accent">{t.tag}</div>}
                <div className="text-xs text-text-mid mt-1">{t.exercises.map((e) => e.name).join(' · ') || 'No exercises'}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing(t)} className="flex-1 py-2 rounded-lg bg-surface-2 border border-border-strong text-sm font-semibold">Edit</button>
              <button onClick={() => remove(t._id)} className="py-2 px-4 rounded-lg border border-danger/50 text-danger text-sm font-semibold">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notes tab ──────────────────────────────────────────────────────
function NotesTab({ trainee }) {
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await api.get(`/api/coach/trainees/${trainee.id}`);
      setSessions(data.sessions);
      setLoaded(true);
    })();
  }, [trainee.id]);

  if (!loaded) return <div className="text-text-dim text-xs font-mono animate-pulse py-8 text-center">loading…</div>;
  if (sessions.length === 0) return <div className="text-text-dim text-sm italic text-center py-10">No logged sessions yet.</div>;

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <SessionNote key={s._id} session={s} />
      ))}
    </div>
  );
}

function SessionNote({ session }) {
  const [note, setNote] = useState(session.coachNote || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = note !== (session.coachNote || '');

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.put(`/api/coach/sessions/${session._id}/note`, { coachNote: note });
      session.coachNote = note;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-sm">{session.name || 'Workout'}</div>
        <div className="font-mono text-xs text-text-mid">
          {formatDate(session.date)} · <span className="text-accent">{session.setsCompleted}/{session.setsTotal}</span>
        </div>
      </div>
      <textarea
        rows={2}
        className="field !py-2 !text-sm resize-none"
        placeholder="Leave a note for this session…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
      />
      <div className="flex items-center justify-end gap-3 mt-2">
        {saved && <span className="text-xs text-accent">Saved ✓</span>}
        <button onClick={save} disabled={!dirty || saving} className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded border border-border-strong text-text-mid hover:text-text disabled:opacity-40">
          {saving ? 'Saving…' : 'Save note'}
        </button>
      </div>
    </div>
  );
}
