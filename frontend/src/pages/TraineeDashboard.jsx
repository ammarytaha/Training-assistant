import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { api } from '../api';
import { todayISO, isoFor, formatDate } from '../lib/date';
import WorkoutTracker from '../components/WorkoutTracker';
import AIChat from '../components/AIChat';
import BodyweightChart from '../components/BodyweightChart';
import SkillTree from '../components/SkillTree';

export default function TraineeDashboard() {
  const { user, logout } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(null); // { workout, date, readOnly }
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('train'); // 'train' | 'progress' | 'skills'

  async function load() {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const from = isoFor(monday);
    const future = new Date(today);
    future.setDate(today.getDate() + 28);
    const to = isoFor(future);

    const [schedRes, sessRes] = await Promise.all([
      api.get(`/api/schedule/me?from=${from}&to=${to}`),
      api.get('/api/sessions/me'),
    ]);
    setSchedule(schedRes.schedule);
    setSessions(sessRes.sessions);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }

  async function onFinished(complete) {
    setActive(null);
    await load();
    showToast(complete ? 'WORKOUT LOGGED ✓' : 'PROGRESS SAVED');
  }

  const scheduleByDate = useMemo(
    () => Object.fromEntries(schedule.map((w) => [w.date, w])),
    [schedule]
  );
  const doneDates = useMemo(() => new Set(sessions.map((s) => s.date)), [sessions]);

  function openDay(iso) {
    const workout = scheduleByDate[iso];
    if (!workout) return;
    setActive({ workout, date: iso, readOnly: iso > todayISO() });
  }

  const week = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return labels.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = isoFor(d);
      return {
        label,
        day: d.getDate(),
        iso,
        isToday: iso === todayISO(),
        scheduled: Boolean(scheduleByDate[iso]),
        done: doneDates.has(iso),
      };
    });
  }, [scheduleByDate, doneDates]);

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = isoFor(d);
      if (doneDates.has(iso)) count++;
      else if (i > 0) break;
    }
    return count;
  }, [doneDates]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-text-mid font-mono text-sm animate-pulse">
        Loading your schedule…
      </div>
    );
  }

  if (active) {
    return (
      <div className="max-w-app mx-auto px-4 sm:px-5 pt-5">
        <WorkoutTracker
          workout={active.workout}
          date={active.date}
          readOnly={active.readOnly}
          onBack={() => setActive(null)}
          onFinished={onFinished}
        />
      </div>
    );
  }

  const today = todayISO();
  const todaysWorkout = scheduleByDate[today];
  const todayDone = doneDates.has(today);
  const upcoming = schedule.filter((w) => w.date > today).slice(0, 10);
  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="max-w-app mx-auto px-4 sm:px-5 pt-5 pb-28">
      <header className="flex justify-between items-end mb-8 pb-4 border-b border-border">
        <div className="font-black text-2xl tracking-tight leading-none">
          TRAIN<span className="text-accent">.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-text-mid uppercase tracking-wider">{formatDate(today)}</span>
          <button onClick={logout} className="text-xs text-text-dim hover:text-text">Log out</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-surface border border-border rounded-lg p-1 mb-6">
        {[
          ['train', 'Train'],
          ['progress', 'Progress'],
          ['skills', 'Skills'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`py-2 rounded-md text-sm font-semibold transition-colors ${
              view === key ? 'bg-accent text-bg' : 'text-text-mid hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'progress' && (
        <div className="space-y-4">
          <BodyweightChart />
          <CompletionStats sessions={sessions} />
        </div>
      )}

      {view === 'skills' && <SkillTree />}

      {view === 'train' && (
        <>
          {/* Week strip */}
          <div className="flex justify-between items-center text-[11px] uppercase tracking-widest text-text-mid mb-3">
            <span>This Week</span>
            {streak > 0 && <span className="font-mono text-accent">{streak}-DAY STREAK</span>}
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-7">
            {week.map((d) => (
              <button
                key={d.iso}
                onClick={() => openDay(d.iso)}
                disabled={!d.scheduled}
                className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 border transition-colors ${
                  d.done
                    ? 'bg-accent-dim border-accent'
                    : d.scheduled
                    ? 'bg-surface border-accent/50 hover:border-accent'
                    : 'bg-surface border-border'
                } ${d.isToday ? '!border-text' : ''} ${d.scheduled ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="text-[9px] uppercase text-text-mid tracking-wide">{d.label}</div>
                <div className={`font-mono text-[13px] font-bold ${d.done ? 'text-accent' : 'text-text'}`}>{d.day}</div>
                {d.scheduled && !d.done && <div className="w-1 h-1 rounded-full bg-accent" />}
              </button>
            ))}
          </div>

          {/* Today */}
          <div className="text-[11px] uppercase tracking-widest text-text-mid mb-3">Today</div>
          {todaysWorkout ? (
            <button
              onClick={() => openDay(today)}
              className={`w-full text-left bg-surface border rounded-xl p-5 mb-6 transition-colors ${
                todayDone ? 'border-accent' : 'border-border hover:border-border-strong'
              }`}
            >
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                  {todaysWorkout.tag || 'Workout'}
                </span>
                {todayDone && <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">✓ Done</span>}
              </div>
              <div className="text-2xl font-extrabold tracking-tight leading-tight">{todaysWorkout.name}</div>
              <div className="text-xs text-text-mid mt-1">
                {todaysWorkout.exercises.map((e) => e.name).join(' · ')}
              </div>
              <div className="mt-3 inline-block text-xs font-bold text-bg bg-accent rounded px-3 py-1.5">
                {todayDone ? 'Review / re-log →' : 'Start workout →'}
              </div>
            </button>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6 mb-6 text-center">
              <div className="text-3xl mb-2">😌</div>
              <div className="font-bold">Rest day</div>
              <div className="text-xs text-text-mid mt-1">Nothing scheduled for today. Recover well.</div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-widest text-text-mid mb-3">Upcoming</div>
              <div className="space-y-2">
                {upcoming.map((w) => (
                  <button
                    key={w._id}
                    onClick={() => openDay(w.date)}
                    className="w-full text-left flex justify-between items-center bg-surface border border-border rounded-lg px-4 py-3 hover:border-border-strong"
                  >
                    <div>
                      <div className="font-semibold text-sm">{w.name}</div>
                      <div className="font-mono text-xs text-text-mid">{formatDate(w.date)}</div>
                    </div>
                    <span className="text-text-dim text-xs">{w.exercises.length} exercises ›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent sessions */}
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-widest text-text-mid mb-3">Recent Sessions</div>
            {recent.length === 0 ? (
              <div className="text-text-dim text-xs italic text-center py-6">
                No sessions yet. Your scheduled workouts will appear above.
              </div>
            ) : (
              <div>
                {recent.map((s) => (
                  <div key={s._id} className="py-2.5 border-b border-border last:border-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm">{s.name || 'Workout'}</div>
                        <div className="font-mono text-xs text-text-mid">{formatDate(s.date)}</div>
                      </div>
                      <div className="font-mono text-accent font-bold text-sm">
                        {s.setsCompleted}/{s.setsTotal}
                      </div>
                    </div>
                    {s.coachNote && (
                      <div className="mt-2 flex gap-2 bg-surface-2/50 border-l-2 border-warm rounded-r px-3 py-2">
                        <span className="text-warm text-xs shrink-0">Coach</span>
                        <p className="text-xs text-text leading-relaxed">{s.coachNote}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating AI coach */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-5 z-40 bg-accent text-bg font-extrabold rounded-full px-5 py-3.5 shadow-lg shadow-accent/20 flex items-center gap-2"
      >
        <span className="text-lg leading-none">✦</span> AI Coach
      </button>

      <AIChat open={chatOpen} onClose={() => setChatOpen(false)} />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-accent text-bg px-5 py-3 rounded-lg font-bold text-[13px] uppercase tracking-wider">
          {toast}
        </div>
      )}
    </div>
  );
}

function CompletionStats({ sessions }) {
  const total = sessions.length;
  const setsDone = sessions.reduce((sum, s) => sum + (s.setsCompleted || 0), 0);
  const fullyDone = sessions.filter((s) => s.setsTotal > 0 && s.setsCompleted >= s.setsTotal).length;
  const rate = total ? Math.round((fullyDone / total) * 100) : 0;
  const cards = [
    ['Sessions', total],
    ['Sets logged', setsDone],
    ['Completion', `${rate}%`],
  ];
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-widest text-text-mid mb-3">All-time</div>
      <div className="grid grid-cols-3 gap-3">
        {cards.map(([label, value]) => (
          <div key={label} className="text-center">
            <div className="font-mono text-2xl font-bold text-accent">{value}</div>
            <div className="text-[10px] uppercase tracking-wide text-text-mid mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
