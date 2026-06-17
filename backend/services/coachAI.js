const OpenAI = require('openai');
const env = require('../config/env');
const { SKILLS } = require('../data/skillTree');

// The AI coach runs on Google Gemini via its OpenAI-compatible endpoint, so we
// use the openai SDK pointed at Gemini's base URL. The key lives only on the
// server (never the client).
const client = env.gemini.enabled
  ? new OpenAI({ apiKey: env.gemini.apiKey, baseURL: env.gemini.baseUrl })
  : null;

// Build a system prompt grounded in this trainee's real data so the AI gives
// specific, context-aware coaching instead of generic advice.
function buildSystemPrompt({ user, schedule, todayISO, sessions }) {
  const recent = (sessions || [])
    .slice(0, 8)
    .map((s) => `- ${s.date} ${s.name || 'workout'}: ${s.setsCompleted}/${s.setsTotal} sets`)
    .join('\n');

  // Today's assignment + the upcoming scheduled workouts.
  const todays = (schedule || []).find((w) => w.date === todayISO);
  const todayLine = todays
    ? `${todays.name} — ${todays.exercises.map((e) => `${e.name} ${e.reps}`).join(', ')}`
    : 'Rest day (nothing scheduled today).';

  const upcoming = (schedule || [])
    .filter((w) => w.date >= todayISO)
    .slice(0, 7)
    .map((w) => `- ${w.date}: ${w.name} (${w.exercises.map((e) => e.name).join(', ')})`)
    .join('\n');

  // Bodyweight: latest value + simple trend over the log.
  const bw = [...(user?.bodyweightLog || [])].sort((a, b) => a.date.localeCompare(b.date));
  let weightLine = 'unknown';
  if (bw.length) {
    const latest = bw[bw.length - 1];
    weightLine = `${latest.kg} kg (as of ${latest.date})`;
    if (bw.length > 1) {
      const delta = Math.round((latest.kg - bw[0].kg) * 10) / 10;
      weightLine += `, ${delta >= 0 ? '+' : ''}${delta} kg since ${bw[0].date}`;
    }
  }

  // Skill-tree progress: where they are on each progression they've started.
  const progress = user?.skillProgress;
  const getStep = (id) => (progress?.get ? progress.get(id) : progress?.[id]) || 0;
  const skillLines = SKILLS.map((s) => {
    const step = getStep(s.id);
    if (!step) return null;
    const done = step >= s.steps.length;
    const label = done ? 'MASTERED' : `working on "${s.steps[step]?.name || s.steps[s.steps.length - 1].name}"`;
    return `- ${s.name}: ${label} (${Math.min(step, s.steps.length)}/${s.steps.length})`;
  })
    .filter(Boolean)
    .join('\n');

  return `You are an expert calisthenics coach inside a training app. You are coaching ${user?.name || 'a trainee'}. Their coach schedules specific workouts on specific calendar dates.

TODAY'S WORKOUT (${todayISO}):
${todayLine}

UPCOMING SCHEDULE:
${upcoming || 'Nothing scheduled in the next week.'}

RECENT SESSIONS (most recent first):
${recent || 'No logged sessions yet.'}

CURRENT BODYWEIGHT: ${weightLine}

SKILL PROGRESSIONS IN PROGRESS:
${skillLines || 'None started yet — you can suggest a skill goal (muscle-up, handstand, planche, front lever, pistol squat).'}

HOW TO COACH:
- Give specific, practical calisthenics advice grounded in their actual data above when relevant.
- Focus on bodyweight training: progressions, form, programming, recovery, mobility.
- Be encouraging but honest. Keep answers concise and actionable.
- When you reference an exercise that has a coaching video, you may mention it, but never invent links.

SAFETY & SCOPE (important):
- You are NOT a doctor or physical therapist. For pain, injury, or medical concerns, advise seeing a qualified professional — do not diagnose or prescribe treatment.
- Stay on the topic of calisthenics, fitness, training, nutrition basics, and recovery. Politely decline unrelated requests.
- Never provide advice that could cause harm (extreme cutting, overtraining through injury, unsafe progressions).`;
}

// Generate a coaching reply. `history` is [{role, content}, ...] (oldest first).
async function generateReply({ context, history }) {
  if (!client) {
    const err = new Error('AI coach is not configured on the server.');
    err.status = 503;
    throw err;
  }

  // OpenAI takes one messages array; the system prompt is the first message.
  const messages = [
    { role: 'system', content: buildSystemPrompt(context) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await client.chat.completions.create({
    model: env.gemini.model,
    max_tokens: 1024, // concise coaching replies; bump if you want longer answers
    messages,
  });

  return (response.choices[0]?.message?.content || '').trim();
}

module.exports = { generateReply };
