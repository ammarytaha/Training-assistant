const OpenAI = require('openai');
const env = require('../config/env');
const { SKILLS } = require('../data/skillTree');

const client = env.gemini.enabled
  ? new OpenAI({ apiKey: env.gemini.apiKey, baseURL: env.gemini.baseUrl })
  : null;

function buildSystemPrompt({ user, schedule, todayISO, sessions, skills, nutritionPlan }) {
  const recent = (sessions || [])
    .slice(0, 8)
    .map((s) => `- ${s.date} ${s.name || 'workout'}: ${s.setsCompleted}/${s.setsTotal} sets`)
    .join('\n');

  const todays = (schedule || []).find((w) => w.date === todayISO);
  const todayLine = todays
    ? `${todays.name} — ${todays.exercises.map((e) => `${e.name} ${e.reps}`).join(', ')}`
    : 'Rest day (nothing scheduled today).';

  const upcoming = (schedule || [])
    .filter((w) => w.date >= todayISO)
    .slice(0, 7)
    .map((w) => `- ${w.date}: ${w.name} (${w.exercises.map((e) => e.name).join(', ')})`)
    .join('\n');

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

  // Skill progressions
  let skillLines;
  if (Array.isArray(skills)) {
    skillLines = skills
      .map((s) => {
        const total = s.steps.length;
        const step = Math.min(s.currentStep || 0, total);
        if (total === 0) return `- ${s.name}`;
        if (step >= total) return `- ${s.name}: MASTERED (${total}/${total})`;
        if (step === 0) return `- ${s.name}: not started yet — next up "${s.steps[0]?.name}" (0/${total})`;
        return `- ${s.name}: working on "${s.steps[step]?.name}" (${step}/${total})`;
      })
      .join('\n');
  } else {
    const progress = user?.skillProgress;
    const getStep = (id) => (progress?.get ? progress.get(id) : progress?.[id]) || 0;
    skillLines = SKILLS.map((s) => {
      const step = getStep(s.id);
      if (!step) return null;
      const done = step >= s.steps.length;
      const label = done ? 'MASTERED' : `working on "${s.steps[step]?.name || s.steps[s.steps.length - 1].name}"`;
      return `- ${s.name}: ${label} (${Math.min(step, s.steps.length)}/${s.steps.length})`;
    })
      .filter(Boolean)
      .join('\n');
  }

  // Nutrition plan summary for context
  let nutritionLines = 'No nutrition plan assigned yet.';
  if (nutritionPlan && nutritionPlan.meals && nutritionPlan.meals.length > 0) {
    const totalMacros = nutritionPlan.meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.macros?.calories || 0),
        protein:  acc.protein  + (m.macros?.protein  || 0),
        carbs:    acc.carbs    + (m.macros?.carbs     || 0),
        fat:      acc.fat      + (m.macros?.fat       || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    const mealList = nutritionPlan.meals
      .map((m) => {
        const mac = m.macros || {};
        const macStr = [
          mac.calories ? `${mac.calories} kcal` : '',
          mac.protein  ? `${mac.protein}g protein` : '',
          mac.carbs    ? `${mac.carbs}g carbs` : '',
          mac.fat      ? `${mac.fat}g fat` : '',
        ].filter(Boolean).join(', ');
        return `- ${m.name} (${m.mealType}${m.time ? `, ${m.time}` : ''})${macStr ? ': ' + macStr : ''}${m.notes ? ' — note: ' + m.notes.slice(0, 120) : ''}`;
      })
      .join('\n');
    nutritionLines = `Plan: "${nutritionPlan.title}"
Daily totals: ~${Math.round(totalMacros.calories)} kcal, ${Math.round(totalMacros.protein)}g protein, ${Math.round(totalMacros.carbs)}g carbs, ${Math.round(totalMacros.fat)}g fat
Meals:\n${mealList}${nutritionPlan.notes ? `\nCoach note: ${nutritionPlan.notes.slice(0, 300)}` : ''}`;
  }

  return `You are an expert calisthenics coach and nutrition advisor inside a training app. You are coaching ${user?.name || 'a trainee'}. Their coach schedules specific workouts and diet plans for them.

TODAY'S WORKOUT (${todayISO}):
${todayLine}

UPCOMING SCHEDULE:
${upcoming || 'Nothing scheduled in the next week.'}

RECENT SESSIONS (most recent first):
${recent || 'No logged sessions yet.'}

CURRENT BODYWEIGHT: ${weightLine}

SKILL PROGRESSIONS IN PROGRESS:
${skillLines || 'None started yet — you can suggest a skill goal (muscle-up, handstand, planche, front lever, pistol squat).'}

ASSIGNED NUTRITION PLAN:
${nutritionLines}

HOW TO COACH:
- Give specific, practical advice grounded in their actual data above when relevant.
- For training: focus on bodyweight progressions, form, programming, recovery, and mobility.
- For nutrition: help them understand their meal plan, explain macros, answer questions about meal prep and cooking from their plan, and give general dietary advice that supports their training. If no plan is assigned, give sound general nutrition advice for calisthenics athletes.
- Be encouraging but honest. Keep answers concise and actionable.
- When you reference an exercise or meal that has a coaching video, you may mention it, but never invent links.

SAFETY & SCOPE (important):
- You are NOT a doctor, registered dietitian, or physical therapist. For medical concerns, injuries, or clinical eating disorders, advise seeing a qualified professional — do not diagnose or prescribe treatment.
- Stay on the topics of calisthenics, fitness, training, nutrition, meal prep, recovery, and healthy lifestyle. Politely decline unrelated requests.
- Never provide advice that could cause harm (extreme cutting, overtraining through injury, unsafe progressions). For harmful requests, tell the user to speak with their coach directly via the chat tab.`;
}

async function generateReply({ context, history }) {
  if (!client) {
    const err = new Error('AI coach is not configured on the server.');
    err.status = 503;
    throw err;
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(context) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await client.chat.completions.create({
    model: env.gemini.model,
    max_tokens: 1024,
    messages,
  });

  return (response.choices[0]?.message?.content || '').trim();
}

module.exports = { generateReply };
