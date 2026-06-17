const express = require('express');
const { body, param } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { SKILLS, SKILL_BY_ID } = require('../data/skillTree');

const router = express.Router();

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

// ─── Skill tree ─────────────────────────────────────────────────────

// GET /api/profile/skills -> full tree + this user's progress per skill
router.get('/skills', requireAuth, (req, res) => {
  const progress = req.user.skillProgress || new Map();
  const skills = SKILLS.map((s) => ({
    ...s,
    currentStep: progress.get ? progress.get(s.id) || 0 : progress[s.id] || 0,
  }));
  res.json({ skills });
});

// PUT /api/profile/skills/:skillId -> set the current step index for a skill
router.put(
  '/skills/:skillId',
  requireAuth,
  [
    param('skillId').isString(),
    body('currentStep').isInt({ min: 0 }).withMessage('Invalid step.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const skill = SKILL_BY_ID[req.params.skillId];
      if (!skill) return res.status(404).json({ error: 'Unknown skill.' });

      // Clamp to the number of steps (allow == steps.length to mean "mastered").
      const step = Math.min(Number(req.body.currentStep), skill.steps.length);
      req.user.skillProgress.set(skill.id, step);
      await req.user.save();

      return res.json({ skillId: skill.id, currentStep: step });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
