import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { api } from '../api';
import { formatDate, isoFor, todayISO } from '../lib/date';
import WorkoutEditor from '../components/WorkoutEditor';
import SkillForm from '../components/SkillForm';
import ChatThread from '../components/ChatThread';
import ExerciseHistory from '../components/ExerciseHistory';
import NotificationBell from '../components/NotificationBell';
import InviteModal from '../components/InviteModal';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import NutritionPlanEditor from '../components/NutritionPlanEditor';
import MealLibraryPage from '../components/MealLibraryPage';
import { useLanguage } from '../contexts/LanguageContext';

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [trainees, setTrainees] = useState([]);
  const [unread, setUnread] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [mainTab, setMainTab] = useState('trainees'); // 'trainees' | 'mealLibrary'

  async function loadTrainees() {
    const [data, unreadData] = await Promise.all([
      api.get('/api/coach/trainees'),
      api.get('/api/messages/unread').catch(() => ({ byTrainee: {} })),
    ]);
    setTrainees(data.trainees);
    setUnread(unreadData.byTrainee || {});
    setLoading(false);
  }

  useEffect(() => { loadTrainees(); }, []);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-text-mid font-mono text-sm animate-pulse">{t('loading')}</div>;
  }

  if (selected) {
    return <TraineeManager trainee={selected} onBack={() => setSelected(null)} />;
  }

  const needAttention = trainees.filter((tr) => tr.needsAttention).length;

  return (
    <div className="max-w-app mx-auto px-4 sm:px-5 pt-5 pb-16">
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <div>
          <div className="font-black text-2xl tracking-tight leading-none">
            COACH<span className="text-warm">.</span>
          </div>
          <div className="text-xs text-text-mid mt-1">{user?.name}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <NotificationBell />
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => setShowInvite(true)}
            className="bg-accent text-bg font-bold rounded-lg px-3.5 py-2 text-sm"
          >
            {t('inviteBtn')}
          </button>
          <button onClick={logout} className="text-xs text-text-dim hover:text-text">{t('logout')}</button>
        </div>
      </header>

      {/* Top-level tabs: Trainees | Meal Library */}
      <div className="flex gap-1.5 bg-surface border border-border rounded-lg p-1 mb-6">
        {[['trainees', t('tab_trainees')], ['mealLibrary', t('tab_mealLibrary')]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-colors ${
              mainTab === key ? 'bg-warm text-bg' : 'text-text-mid hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Meal Library tab ─────────────────────────────────────────── */}
      {mainTab === 'mealLibrary' && <MealLibraryPage />}

      {/* ── Trainees tab ─────────────────────────────────────────────── */}
      {mainTab === 'trainees' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-widest text-text-mid">
              {t('yourTraineesCount')(trainees.length)}
            </div>
            {needAttention > 0 && (
              <div className="text-[11px] font-semibold text-warm">{t('needAttentionCount')(needAttention)}</div>
            )}
          </div>

          {trainees.length === 0 ? (
            <div className="text-center py-12 bg-surface border border-border rounded-xl">
              <div className="text-3xl mb-3">🤝</div>
              <div className="font-bold mb-1">{t('noTraineesYet')}</div>
              <p className="text-text-mid text-sm mb-5 px-6">{t('noTraineesDesc')}</p>
              <button onClick={() => setShowInvite(true)} className="bg-accent text-bg font-bold rounded-lg px-5 py-2.5 text-sm">
                {t('getInviteLink')}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trainees.map((tr) => (
                <TraineeCard key={tr._id} trainee={tr} unread={unread[tr._id] || 0} onClick={() => setSelected({ ...tr, id: tr._id })} t={t} />
              ))}
            </div>
          )}
        </>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function TraineeCard({ trainee: tr, unread, onClick, t }) {
  const lastLabel = tr.lastSession
    ? tr.daysSince === 0 ? t('today') : tr.daysSince === 1 ? t('yesterday') : t('daysAgo')(tr.daysSince)
    : t('neverTrained');
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-surface border rounded-xl p-4 hover:border-border-strong transition-colors ${
        tr.needsAttention ? 'border-warm/50' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-strong grid place-items-center font-bold text-accent shrink-0">
          {tr.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate">{tr.name}</span>
            {tr.needsAttention && (
              <span className="text-[9px] uppercase tracking-wide font-bold text-warm bg-warm/10 border border-warm/30 rounded px-1.5 py-0.5 shrink-0">
                {t('attention')}
              </span>
            )}
          </div>
          <div className="text-xs text-text-mid truncate">{tr.email}</div>
        </div>
        {unread > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-warm text-bg text-[11px] font-bold grid place-items-center shrink-0">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <span className="text-text-dim shrink-0">›</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-border">
        <Stat value={`${tr.streak}🔥`} label={t('streakLabel')} />
        <Stat value={`${tr.completionRate}%`} label={t('completionLabel')} />
        <Stat value={lastLabel} label={t('lastSession')} small />
      </div>

      <div className="mt-3 text-xs">
        {tr.todayWorkout ? (
          <span className={tr.todayDone ? 'text-accent' : 'text-text-mid'}>
            {tr.todayDone ? t('donePrefix') : t('todayPrefix')} <span className="font-semibold">{tr.todayWorkout}</span>
          </span>
        ) : (
          <span className="text-text-dim">{t('restDayToday')}</span>
        )}
      </div>
    </button>
  );
}

function Stat({ value, label, small }) {
  return (
    <div className="text-center">
      <div className={`font-mono font-bold text-accent ${small ? 'text-xs' : 'text-base'}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-text-mid mt-0.5">{label}</div>
    </div>
  );
}

// ─── Manager for one trainee ────────────────────────────────────────
function TraineeManager({ trainee, onBack }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('calendar');
  const [templates, setTemplates] = useState([]);

  async function loadTemplates() {
    const data = await api.get('/api/coach/templates');
    setTemplates(data.templates);
  }
  useEffect(() => { loadTemplates(); }, []);

  const tabs = [
    ['calendar', t('tab_calendar')],
    ['templates', t('tab_templates')],
    ['nutrition', t('tab_nutrition')],
    ['skills', t('tab_skills')],
    ['progress', t('tab_progress')],
    ['chat', t('tab_chat')],
  ];

  return (
    <div className="max-w-app mx-auto px-4 sm:px-5 pt-5 pb-16">
      <button onClick={onBack} className="text-text-mid hover:text-text text-sm py-2 mb-3">← {t('tab_trainees')}</button>
      <div className="mb-5 pb-4 border-b border-border">
        <h1 className="text-3xl font-black tracking-tight leading-none mb-1">{trainee.name}</h1>
        <div className="text-xs text-text-mid">{trainee.email}</div>
      </div>

      <div className="flex gap-1.5 bg-surface border border-border rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 whitespace-nowrap px-3 py-2 rounded-md text-sm font-semibold ${
              tab === key ? 'bg-warm text-bg' : 'text-text-mid hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && <CalendarTab trainee={trainee} templates={templates} />}
      {tab === 'templates' && <TemplatesTab templates={templates} reload={loadTemplates} />}
      {tab === 'nutrition' && <NutritionPlanEditor traineeId={trainee.id} traineeName={trainee.name} />}
      {tab === 'skills' && <SkillsTab trainee={trainee} />}
      {tab === 'progress' && <ProgressTab trainee={trainee} />}
      {tab === 'chat' && <ChatThread otherId={trainee.id} title={trainee.name} />}
    </div>
  );
}

// ─── Calendar tab ───────────────────────────────────────────────────
function CalendarTab({ trainee, templates }) {
  const { t } = useLanguage();
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
  useEffect(() => { load(); }, [monthBounds.from]); // eslint-disable-line react-hooks/exhaustive-deps

  const byDate = useMemo(() => Object.fromEntries(schedule.map((w) => [w.date, w])), [schedule]);

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
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="text-text-mid hover:text-text px-2 py-1">{t('prevMonth')}</button>
        <div className="font-extrabold">{monthLabel}</div>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="text-text-mid hover:text-text px-2 py-1">{t('nextMonth')}</button>
      </div>

      <button onClick={() => setShowRepeat(true)} className="w-full mb-4 py-2.5 rounded-lg border border-warm/50 text-warm text-sm font-semibold hover:bg-warm/10">
        {t('fillMonthBtn')}
      </button>

      <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] uppercase text-text-dim text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
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

      {selectedDate && (
        <DayEditor
          trainee={trainee} date={selectedDate} workout={selectedWorkout}
          templates={templates} onClose={() => setSelectedDate(null)} onChanged={load}
        />
      )}
      {showRepeat && (
        <RepeatModal
          trainee={trainee} templates={templates}
          defaultFrom={monthBounds.from} defaultTo={monthBounds.to}
          onClose={() => setShowRepeat(false)}
          onDone={() => { setShowRepeat(false); load(); }}
        />
      )}
    </div>
  );
}

function DayEditor({ trainee, date, workout, templates, onClose, onChanged }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('view');
  const [templateId, setTemplateId] = useState(templates[0]?._id || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function assignTemplate() {
    if (!templateId) return;
    setSaving(true); setErr('');
    try { await api.post(`/api/coach/trainees/${trainee.id}/schedule`, { templateId, dates: [date] }); await onChanged(); }
    catch (e) { setErr(e.message); } finally { setSaving(false); }
  }
  async function remove() {
    setSaving(true); setErr('');
    try { await api.del(`/api/coach/schedule/${workout._id}`); await onChanged(); }
    catch (e) { setErr(e.message); } finally { setSaving(false); }
  }
  async function saveEdit(data) {
    setSaving(true); setErr('');
    try { await api.put(`/api/coach/schedule/${workout._id}`, data); setMode('view'); await onChanged(); }
    catch (e) { setErr(e.message); } finally { setSaving(false); }
  }
  async function saveCustom(data) {
    setSaving(true); setErr('');
    try { await api.post(`/api/coach/trainees/${trainee.id}/schedule`, { workout: data, dates: [date] }); setMode('view'); await onChanged(); }
    catch (e) { setErr(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="bg-surface border border-warm/50 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold">{formatDate(date)}</div>
        <button onClick={onClose} className="text-text-mid text-sm">{t('close')} ✕</button>
      </div>
      {err && <div className="mb-3 text-xs text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">{err}</div>}

      {mode === 'edit' && workout ? (
        <WorkoutEditor initial={workout} onSave={saveEdit} onCancel={() => setMode('view')} saving={saving} submitLabel={t('saveDay')} />
      ) : mode === 'custom' ? (
        <WorkoutEditor initial={{ exercises: [] }} onSave={saveCustom} onCancel={() => setMode('view')} saving={saving} submitLabel={t('assignCustom')} />
      ) : workout ? (
        <div>
          <div className="text-xl font-extrabold">{workout.name}</div>
          {workout.tag && <div className="text-xs text-accent uppercase tracking-wide mb-2">{workout.tag}</div>}
          <div className="text-xs text-text-mid mb-3">{workout.exercises.map((e) => e.name).join(' · ')}</div>
          <div className="flex gap-2">
            <button onClick={() => setMode('edit')} className="flex-1 py-2.5 rounded-lg bg-surface-2 border border-border-strong text-sm font-semibold">{t('editThisDay')}</button>
            <button onClick={remove} disabled={saving} className="py-2.5 px-4 rounded-lg border border-danger/50 text-danger text-sm font-semibold">{t('remove')}</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm text-text-mid mb-3">{t('noWorkoutDay')}</div>
          <div className="flex gap-2 mb-2">
            <select className="field !py-2.5 !text-sm flex-1" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((tp) => <option key={tp._id} value={tp._id}>{tp.name}</option>)}
            </select>
            <button onClick={assignTemplate} disabled={saving || !templateId} className="bg-accent text-bg font-bold rounded-lg px-4 text-sm">{t('assign')}</button>
          </div>
          <button onClick={() => setMode('custom')} className="w-full py-2.5 rounded-lg border border-border-strong text-sm font-semibold text-text-mid hover:text-text">
            {t('buildCustom')}
          </button>
        </div>
      )}
    </div>
  );
}

function RepeatModal({ trainee, templates, defaultFrom, defaultTo, onClose, onDone }) {
  const { t } = useLanguage();
  const [templateId, setTemplateId] = useState(templates[0]?._id || '');
  const [weekdays, setWeekdays] = useState([1, 3, 5]);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  function toggle(i) { setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])); }

  async function apply() {
    if (!templateId || weekdays.length === 0) return;
    setSaving(true); setMsg('');
    try {
      const res = await api.post(`/api/coach/trainees/${trainee.id}/schedule`, { templateId, weekdays, from, to });
      setMsg(t('assignedDays')(res.assigned));
      setTimeout(onDone, 700);
    } catch (err) { setMsg(err.message); setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/70 backdrop-blur" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-extrabold mb-1">{t('repeatOnWeekdays')}</h2>
        <p className="text-xs text-text-mid mb-4">{t('repeatDesc')}</p>

        <label className="label">{t('workoutLabel')}</label>
        <select className="field !py-2.5 !text-sm mb-4" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((tp) => <option key={tp._id} value={tp._id}>{tp.name}</option>)}
        </select>

        <label className="label">{t('weekdaysLabel')}</label>
        <div className="flex gap-1.5 mb-4">
          {labels.map((l, i) => (
            <button key={i} onClick={() => toggle(i)}
              className={`flex-1 py-2 rounded-md text-xs font-bold border ${weekdays.includes(i) ? 'bg-accent text-bg border-accent' : 'bg-surface-2 border-border text-text-mid'}`}
            >{l}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="label">{t('fromLabel')}</label>
            <input type="date" className="field !py-2.5 !text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('toLabel')}</label>
            <input type="date" className="field !py-2.5 !text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        {msg && <div className="text-xs text-accent mb-3">{msg}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-border-strong rounded-lg text-sm font-semibold text-text-mid">{t('cancel')}</button>
          <button onClick={apply} disabled={saving || !templateId || weekdays.length === 0} className="flex-1 btn-accent !py-3">
            {saving ? t('assigning') : t('assign')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Templates tab ──────────────────────────────────────────────────
function TemplatesTab({ templates, reload }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save(data) {
    setSaving(true);
    try {
      if (editing === 'new') await api.post('/api/coach/templates', data);
      else await api.put(`/api/coach/templates/${editing._id}`, data);
      setEditing(null);
      await reload();
    } finally { setSaving(false); }
  }
  async function remove(id) { await api.del(`/api/coach/templates/${id}`); await reload(); }

  if (editing) {
    return (
      <div>
        <div className="font-bold mb-3">{editing === 'new' ? t('newTemplateLabel') : t('editingLabel')(editing.name)}</div>
        <WorkoutEditor initial={editing === 'new' ? { exercises: [] } : editing} onSave={save} onCancel={() => setEditing(null)} saving={saving} submitLabel={t('saveTemplate')} />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setEditing('new')} className="w-full mb-4 py-2.5 rounded-lg bg-accent text-bg font-bold text-sm">{t('newTemplate')}</button>
      <div className="space-y-2.5">
        {templates.map((tp) => (
          <div key={tp._id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-extrabold">{tp.name}</div>
                {tp.tag && <div className="text-[10px] uppercase tracking-wide text-accent">{tp.tag}</div>}
                <div className="text-xs text-text-mid mt-1">{tp.exercises.map((e) => e.name).join(' · ') || t('noExercisesLabel')}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing(tp)} className="flex-1 py-2 rounded-lg bg-surface-2 border border-border-strong text-sm font-semibold">{t('edit')}</button>
              <button onClick={() => remove(tp._id)} className="py-2 px-4 rounded-lg border border-danger/50 text-danger text-sm font-semibold">{t('delete')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skills tab ─────────────────────────────────────────────────────
function SkillsTab({ trainee }) {
  const { t } = useLanguage();
  const [skills, setSkills] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const d = await api.get(`/api/coach/trainees/${trainee.id}/skills`);
    setSkills(d.skills);
    setLoaded(true);
  }
  useEffect(() => { load(); }, [trainee.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(data) {
    setSaving(true);
    try {
      if (editing === 'new') await api.post(`/api/coach/trainees/${trainee.id}/skills`, data);
      else await api.put(`/api/coach/skills/${editing._id}`, data);
      setEditing(null);
      await load();
    } finally { setSaving(false); }
  }
  async function remove(id) { await api.del(`/api/coach/skills/${id}`); await load(); }

  if (editing) {
    return (
      <div>
        <div className="font-bold mb-3">{editing === 'new' ? t('newSkill') : t('editingLabel')(editing.name)}</div>
        <SkillForm initial={editing === 'new' ? { steps: [] } : editing} onSave={save} onCancel={() => setEditing(null)} saving={saving} submitLabel={t('saveSkill')} />
      </div>
    );
  }

  if (!loaded) return <div className="text-text-dim text-xs font-mono animate-pulse py-8 text-center">{t('loadingSkills')}</div>;

  return (
    <div>
      <p className="text-xs text-text-mid mb-3">{t('skillsDesc')(trainee.name.split(' ')[0])}</p>
      <button onClick={() => setEditing('new')} className="w-full mb-4 py-2.5 rounded-lg bg-accent text-bg font-bold text-sm">{t('newSkill')}</button>
      <div className="space-y-2.5">
        {skills.map((s) => {
          const done = Math.min(s.currentStep, s.steps.length);
          return (
            <div key={s._id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1">
                  <div className="font-extrabold leading-tight">{s.name}</div>
                  <div className="text-xs text-text-mid mt-0.5">{t('stepsInfo')(s.steps.length, done, s.steps.length)}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditing(s)} className="flex-1 py-2 rounded-lg bg-surface-2 border border-border-strong text-sm font-semibold">{t('edit')}</button>
                <button onClick={() => remove(s._id)} className="py-2 px-4 rounded-lg border border-danger/50 text-danger text-sm font-semibold">{t('delete')}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Progress tab ────────────────────────────────────────────────────
function ProgressTab({ trainee }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-text-mid mb-3">{t('exerciseHistory')}</div>
        <ExerciseHistory endpoint={`/api/coach/trainees/${trainee.id}/exercises`} />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-text-mid mb-3">{t('sessionNotes')}</div>
        <NotesTab trainee={trainee} />
      </div>
    </div>
  );
}

function NotesTab({ trainee }) {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await api.get(`/api/coach/trainees/${trainee.id}`);
      setSessions(data.sessions);
      setLoaded(true);
    })();
  }, [trainee.id]);

  if (!loaded) return <div className="text-text-dim text-xs font-mono animate-pulse py-8 text-center">{t('loading')}</div>;
  if (sessions.length === 0) return <div className="text-text-dim text-sm italic text-center py-10">{t('noLoggedSessions')}</div>;

  return (
    <div className="space-y-2">
      {sessions.map((s) => <SessionNote key={s._id} session={s} />)}
    </div>
  );
}

function SessionNote({ session }) {
  const { t } = useLanguage();
  const [note, setNote] = useState(session.coachNote || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = note !== (session.coachNote || '');

  async function save() {
    setSaving(true); setSaved(false);
    try {
      await api.put(`/api/coach/sessions/${session._id}/note`, { coachNote: note });
      session.coachNote = note;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-sm">{session.name || 'Workout'}</div>
        <div className="font-mono text-xs text-text-mid">
          {formatDate(session.date)} · <span className="text-accent">{session.setsCompleted}/{session.setsTotal}</span>
        </div>
      </div>
      <textarea rows={2} className="field !py-2 !text-sm resize-none" placeholder={t('leaveNoteHint')} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      <div className="flex items-center justify-end gap-3 mt-2">
        {saved && <span className="text-xs text-accent">{t('savedNote')}</span>}
        <button onClick={save} disabled={!dirty || saving} className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded border border-border-strong text-text-mid hover:text-text disabled:opacity-40">
          {saving ? t('saving') : t('saveNote')}
        </button>
      </div>
    </div>
  );
}
