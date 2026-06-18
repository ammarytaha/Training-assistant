const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const WorkoutTemplate = require('../models/WorkoutTemplate');
const ScheduledWorkout = require('../models/ScheduledWorkout');
const Invite = require('../models/Invite');
const TraineeSkill = require('../models/TraineeSkill');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { defaultTemplates } = require('../data/defaultPlan');
const { generateToken } = require('../utils/invite');
const { ensureSkills, skillSnapshot } = require('../utils/skills');
const { buildExerciseHistory } = require('../utils/exerciseHistory');
const env = require('../config/env');

const router = express.Router();

// All coach routes require an authenticated coach (or admin).
router.use(requireAuth, requireRole('coach', 'admin'));

// ─── Helpers ────────────────────────────────────────────────────────

// Ensure every exercise has a unique non-empty key (generate where missing).
function normalizeExercises(exercises) {
  const seen = new Set();
  return (exercises || []).map((ex, i) => {
    let key = (ex.key || '').trim();
    if (!key || seen.has(key)) key = `ex_${Date.now().toString(36)}_${i}_${Math.random().toString(36).slice(2, 6)}`;
    seen.add(key);
    return {
      key,
      name: (ex.name || 'Exercise').toString().slice(0, 80),
      reps: (ex.reps || '').toString().slice(0, 40),
      sets: Math.max(0, Math.min(30, Number(ex.sets) || 0)),
      info: (ex.info || '').toString().slice(0, 2000),
      videoUrl: (ex.videoUrl || '').toString().slice(0, 500),
    };
  });
}

// Snapshot the workout fields the trainee needs from a template or custom body.
function workoutSnapshot(src) {
  return {
    name: (src.name || 'Workout').toString().slice(0, 80),
    tag: (src.tag || '').toString().slice(0, 80),
    isSuperset: Boolean(src.isSuperset),
    rounds: Math.max(0, Math.min(20, Number(src.rounds) || 0)),
    exercises: normalizeExercises(src.exercises),
  };
}

// Load a trainee and confirm this coach owns them (admins bypass).
async function loadOwnedTrainee(req, res, next) {
  try {
    const trainee = await User.findById(req.params.traineeId);
    if (!trainee || trainee.role !== 'trainee') return res.status(404).json({ error: 'Trainee not found.' });
    if (req.user.role !== 'admin' && String(trainee.coach) !== String(req.user._id)) {
      return res.status(403).json({ error: 'This trainee is not assigned to you.' });
    }
    req.trainee = trainee;
    return next();
  } catch (err) {
    return next(err);
  }
}

// ─── Invite links ───────────────────────────────────────────────────

function invitePayload(invite) {
  return {
    id: invite._id,
    token: invite.token,
    url: `${env.clientUrl}/join/${invite.token}`,
    active: invite.active,
    usedCount: invite.usedCount,
    createdAt: invite.createdAt,
  };
}

// Current active invite link (created on first request).
router.get('/invite', async (req, res, next) => {
  try {
    let invite = await Invite.findOne({ coach: req.user._id, active: true }).sort({ createdAt: -1 });
    if (!invite) invite = await Invite.create({ coach: req.user._id, token: generateToken() });
    return res.json({ invite: invitePayload(invite) });
  } catch (err) {
    return next(err);
  }
});

// Rotate the link — old links stop working, a fresh one is issued.
router.post('/invite/regenerate', async (req, res, next) => {
  try {
    await Invite.updateMany({ coach: req.user._id, active: true }, { $set: { active: false } });
    const invite = await Invite.create({ coach: req.user._id, token: generateToken() });
    return res.status(201).json({ invite: invitePayload(invite) });
  } catch (err) {
    return next(err);
  }
});

// ─── Trainees ───────────────────────────────────────────────────────

const ISO = (d) => d.toISOString().split('T')[0];
function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ISO(d);
}

// Roll a trainee's sessions up into the headline numbers the overview shows.
function statsFor(sessions) {
  const today = ISO(new Date());
  const dates = new Set(sessions.map((s) => s.date));

  let lastSession = null;
  for (const s of sessions) if (!lastSession || s.date > lastSession) lastSession = s.date;

  // Consecutive training days counting back from today (or yesterday).
  let streak = 0;
  for (let i = dates.has(today) ? 0 : 1; i < 90; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (dates.has(ISO(d))) streak++;
    else break;
  }

  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const fully = recent.filter((s) => s.setsTotal > 0 && s.setsCompleted >= s.setsTotal).length;
  const completionRate = recent.length ? Math.round((fully / recent.length) * 100) : 0;

  const daysSince = lastSession ? Math.floor((new Date(today) - new Date(lastSession)) / 86400000) : null;
  const needsAttention = daysSince === null || daysSince >= 4;

  return { lastSession, streak, completionRate, sessionCount: sessions.length, daysSince, needsAttention };
}

router.get('/trainees', async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { role: 'trainee' } : { role: 'trainee', coach: req.user._id };
    const trainees = await User.find(filter).select('name email avatar createdAt').lean();
    const ids = trainees.map((t) => t._id);
    const today = ISO(new Date());

    // Batch the two reads instead of querying per-trainee (avoids N+1).
    const [sessions, todaySched] = await Promise.all([
      Session.find({ trainee: { $in: ids }, date: { $gte: isoDaysAgo(90) } })
        .select('trainee date setsCompleted setsTotal')
        .lean(),
      ScheduledWorkout.find({ trainee: { $in: ids }, date: today }).select('trainee name').lean(),
    ]);

    const byTrainee = new Map(ids.map((id) => [String(id), []]));
    for (const s of sessions) byTrainee.get(String(s.trainee))?.push(s);
    const schedToday = new Map(todaySched.map((w) => [String(w.trainee), w.name]));
    const doneToday = new Set(sessions.filter((s) => s.date === today).map((s) => String(s.trainee)));

    const enriched = trainees.map((t) => {
      const tid = String(t._id);
      return {
        ...t,
        ...statsFor(byTrainee.get(tid) || []),
        todayWorkout: schedToday.get(tid) || null,
        todayDone: doneToday.has(tid),
      };
    });

    return res.json({ trainees: enriched });
  } catch (err) {
    return next(err);
  }
});

router.post('/trainees/:traineeId/claim', async (req, res, next) => {
  try {
    const trainee = await User.findById(req.params.traineeId);
    if (!trainee || trainee.role !== 'trainee') return res.status(404).json({ error: 'Trainee not found.' });
    trainee.coach = req.user._id;
    await trainee.save();
    return res.json({ trainee: { id: trainee._id, name: trainee.name, email: trainee.email } });
  } catch (err) {
    return next(err);
  }
});

router.get('/trainees/:traineeId', loadOwnedTrainee, async (req, res, next) => {
  try {
    const sessions = await Session.find({ trainee: req.trainee._id }).sort({ date: -1 }).limit(30);
    return res.json({
      trainee: {
        id: req.trainee._id,
        name: req.trainee.name,
        email: req.trainee.email,
        avatar: req.trainee.avatar,
      },
      sessions,
    });
  } catch (err) {
    return next(err);
  }
});

// ─── Template library (per coach) ───────────────────────────────────

router.get('/templates', async (req, res, next) => {
  try {
    let templates = await WorkoutTemplate.find({ coach: req.user._id }).sort({ createdAt: 1 });
    if (templates.length === 0) {
      // First use → seed the coach's library from the starter workouts.
      const seeds = defaultTemplates().map((t) => ({ ...t, coach: req.user._id }));
      templates = await WorkoutTemplate.insertMany(seeds);
    }
    return res.json({ templates });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/templates',
  [body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Template name required.')],
  validate,
  async (req, res, next) => {
    try {
      const template = await WorkoutTemplate.create({
        coach: req.user._id,
        ...workoutSnapshot(req.body),
      });
      return res.status(201).json({ template });
    } catch (err) {
      return next(err);
    }
  }
);

router.put(
  '/templates/:id',
  [body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Template name required.')],
  validate,
  async (req, res, next) => {
    try {
      const template = await WorkoutTemplate.findOne({ _id: req.params.id, coach: req.user._id });
      if (!template) return res.status(404).json({ error: 'Template not found.' });
      Object.assign(template, workoutSnapshot(req.body));
      await template.save();
      return res.json({ template });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/templates/:id', async (req, res, next) => {
  try {
    const result = await WorkoutTemplate.deleteOne({ _id: req.params.id, coach: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Template not found.' });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// ─── Scheduling ─────────────────────────────────────────────────────

// Compute the dates between from..to (inclusive) that fall on the given weekdays.
// weekday: 0=Sun .. 6=Sat.
function datesForWeekdays(from, to, weekdays) {
  const out = [];
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const set = new Set(weekdays.map(Number));
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (set.has(d.getDay())) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push(iso);
    }
  }
  return out;
}

// GET schedule (+ sessions) for a trainee in a date range, for the calendar.
router.get('/trainees/:traineeId/schedule', loadOwnedTrainee, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = from && to ? { date: { $gte: from, $lte: to } } : {};
    const [schedule, sessions] = await Promise.all([
      ScheduledWorkout.find({ trainee: req.trainee._id, ...range }).sort({ date: 1 }),
      Session.find({ trainee: req.trainee._id, ...range }).select('date setsCompleted setsTotal'),
    ]);
    return res.json({ schedule, sessions });
  } catch (err) {
    return next(err);
  }
});

// Assign a workout to one or more dates. Body forms:
//   { templateId, dates: [...] }
//   { templateId, weekdays: [1,3,5], from, to }
//   { workout: {name, exercises, ...}, dates: [...] }  (custom, no template)
router.post('/trainees/:traineeId/schedule', loadOwnedTrainee, async (req, res, next) => {
  try {
    const { templateId, workout, dates, weekdays, from, to } = req.body;

    // Resolve the workout source.
    let snapshot;
    let sourceTemplate = null;
    if (templateId) {
      const tpl = await WorkoutTemplate.findOne({ _id: templateId, coach: req.user._id });
      if (!tpl) return res.status(404).json({ error: 'Template not found.' });
      snapshot = workoutSnapshot(tpl);
      sourceTemplate = tpl._id;
    } else if (workout && workout.name) {
      snapshot = workoutSnapshot(workout);
    } else {
      return res.status(400).json({ error: 'Provide a templateId or a custom workout.' });
    }

    // Resolve target dates.
    let targetDates = [];
    if (Array.isArray(dates) && dates.length) {
      targetDates = dates;
    } else if (Array.isArray(weekdays) && weekdays.length && from && to) {
      targetDates = datesForWeekdays(from, to, weekdays);
    } else {
      return res.status(400).json({ error: 'Provide dates[], or weekdays[] with from/to.' });
    }

    if (targetDates.length === 0) return res.status(400).json({ error: 'No matching dates.' });
    if (targetDates.length > 200) return res.status(400).json({ error: 'Too many dates (max 200).' });

    // Upsert one scheduled workout per date (replaces any existing that day).
    const ops = targetDates.map((date) => ({
      updateOne: {
        filter: { trainee: req.trainee._id, date },
        update: {
          $set: { ...snapshot, trainee: req.trainee._id, coach: req.user._id, date, sourceTemplate },
        },
        upsert: true,
      },
    }));
    await ScheduledWorkout.bulkWrite(ops);

    return res.status(201).json({ assigned: targetDates.length, dates: targetDates });
  } catch (err) {
    return next(err);
  }
});

// Edit a single scheduled workout (full exercise CRUD handled client-side).
router.put('/schedule/:id', async (req, res, next) => {
  try {
    const sw = await ScheduledWorkout.findById(req.params.id).populate('trainee', 'coach role');
    if (!sw) return res.status(404).json({ error: 'Scheduled workout not found.' });
    if (req.user.role !== 'admin' && String(sw.trainee.coach) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your trainee.' });
    }
    Object.assign(sw, workoutSnapshot(req.body));
    await sw.save();
    return res.json({ scheduledWorkout: sw });
  } catch (err) {
    return next(err);
  }
});

router.delete('/schedule/:id', async (req, res, next) => {
  try {
    const sw = await ScheduledWorkout.findById(req.params.id).populate('trainee', 'coach');
    if (!sw) return res.status(404).json({ error: 'Scheduled workout not found.' });
    if (req.user.role !== 'admin' && String(sw.trainee.coach) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your trainee.' });
    }
    await sw.deleteOne();
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// Per-exercise history for one trainee (coach view).
router.get('/trainees/:traineeId/exercises', loadOwnedTrainee, async (req, res, next) => {
  try {
    const sessions = await Session.find({ trainee: req.trainee._id }).select('date perExercise').lean();
    return res.json({ exercises: buildExerciseHistory(sessions) });
  } catch (err) {
    return next(err);
  }
});

// ─── Skills (per trainee) ───────────────────────────────────────────

// List a trainee's skill progressions (seeds defaults on first use).
router.get('/trainees/:traineeId/skills', loadOwnedTrainee, async (req, res, next) => {
  try {
    const skills = await ensureSkills(req.trainee);
    return res.json({ skills });
  } catch (err) {
    return next(err);
  }
});

// Add a new skill for this trainee.
router.post(
  '/trainees/:traineeId/skills',
  loadOwnedTrainee,
  [body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Skill name required.')],
  validate,
  async (req, res, next) => {
    try {
      const count = await TraineeSkill.countDocuments({ trainee: req.trainee._id });
      const skill = await TraineeSkill.create({
        trainee: req.trainee._id,
        coach: req.user._id,
        order: count,
        currentStep: 0,
        ...skillSnapshot(req.body),
      });
      return res.status(201).json({ skill });
    } catch (err) {
      return next(err);
    }
  }
);

// Load a skill and confirm the requesting coach owns its trainee.
async function loadOwnedSkill(req, res, next) {
  try {
    const skill = await TraineeSkill.findById(req.params.id).populate('trainee', 'coach');
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });
    if (req.user.role !== 'admin' && String(skill.trainee.coach) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your trainee.' });
    }
    req.skill = skill;
    return next();
  } catch (err) {
    return next(err);
  }
}

// Edit a skill (name, steps, etc.). Keeps currentStep within the new step count.
router.put(
  '/skills/:id',
  loadOwnedSkill,
  [body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Skill name required.')],
  validate,
  async (req, res, next) => {
    try {
      Object.assign(req.skill, skillSnapshot(req.body));
      req.skill.currentStep = Math.min(req.skill.currentStep, req.skill.steps.length);
      await req.skill.save();
      return res.json({ skill: req.skill });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/skills/:id', loadOwnedSkill, async (req, res, next) => {
  try {
    await req.skill.deleteOne();
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// ─── Session feedback ───────────────────────────────────────────────

router.put(
  '/sessions/:sessionId/note',
  [body('coachNote').isString().isLength({ max: 1000 }).withMessage('Note too long.')],
  validate,
  async (req, res, next) => {
    try {
      const session = await Session.findById(req.params.sessionId).populate('trainee', 'coach');
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      if (req.user.role !== 'admin' && String(session.trainee.coach) !== String(req.user._id)) {
        return res.status(403).json({ error: 'Not your trainee.' });
      }
      session.coachNote = req.body.coachNote;
      await session.save();
      return res.json({ session });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
