const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Session = require('../models/Session');
const TraineeSkill = require('../models/TraineeSkill');
const { ensureSkills } = require('../utils/skills');
const { buildExerciseHistory } = require('../utils/exerciseHistory');

const router = express.Router();

// Shape a skill doc for the frontend (keeps `id` for the existing UI).
function skillView(doc) {
  return {
    id: doc._id,
    name: doc.name,
    group: doc.group,
    icon: doc.icon,
    blurb: doc.blurb,
    steps: doc.steps,
    currentStep: doc.currentStep,
  };
}

// ─── Bodyweight log ─────────────────────────────────────────────────

// GET /api/profile/bodyweight -> chronological list of { date, kg }
router.get('/bodyweight', requireAuth, (req, res) => {
  const log = [...(req.user.bodyweightLog || [])].sort((a, b) => a.date.localeCompare(b.date));
  res.json({ log });
});

// POST /api/profile/bodyweight -> add/replace today's (or given date's) weight
router.post(
  '/bodyweight',
  requireAuth,
  [
    body('kg').isFloat({ min: 20, max: 400 }).withMessage('Enter a realistic weight in kg.'),
    body('date').optional().isISO8601().withMessage('Invalid date.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const date = req.body.date || new Date().toISOString().split('T')[0];
      const kg = Math.round(Number(req.body.kg) * 10) / 10;

      const log = req.user.bodyweightLog || [];
      const existing = log.find((e) => e.date === date);
      if (existing) existing.kg = kg;
      else log.push({ date, kg });

      req.user.bodyweightLog = log;
      await req.user.save();

      const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
      return res.status(201).json({ log: sorted });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── Exercise history ───────────────────────────────────────────────

// GET /api/profile/exercises -> per-exercise rep history + PRs for this trainee.
router.get('/exercises', requireAuth, async (req, res, next) => {
  try {
    const sessions = await Session.find({ trainee: req.user._id }).select('date perExercise').lean();
    return res.json({ exercises: buildExerciseHistory(sessions) });
  } catch (err) {
    return next(err);
  }
});

// ─── Skill tree (per-trainee, coach-editable) ───────────────────────

// GET /api/profile/skills -> this trainee's assigned skills + their progress.
router.get('/skills', requireAuth, async (req, res, next) => {
  try {
    const skills = await ensureSkills(req.user);
    return res.json({ skills: skills.map(skillView) });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/profile/skills/:id -> the trainee advances/sets their current step.
router.put(
  '/skills/:id',
  requireAuth,
  [body('currentStep').isInt({ min: 0 }).withMessage('Invalid step.')],
  validate,
  async (req, res, next) => {
    try {
      const skill = await TraineeSkill.findOne({ _id: req.params.id, trainee: req.user._id });
      if (!skill) return res.status(404).json({ error: 'Skill not found.' });

      // Clamp to the number of steps (== steps.length means "mastered").
      skill.currentStep = Math.min(Math.max(0, Number(req.body.currentStep)), skill.steps.length);
      await skill.save();

      return res.json({ skill: skillView(skill) });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
