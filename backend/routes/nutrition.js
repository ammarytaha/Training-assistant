const express = require('express');
const { body } = require('express-validator');
const NutritionPlan = require('../models/NutritionPlan');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─── Trainee: read own plan ─────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const plan = await NutritionPlan.findOne({ trainee: req.user._id, active: true });
    return res.json({ plan: plan || null });
  } catch (err) {
    return next(err);
  }
});

// ─── Coach: read a trainee's plan ──────────────────────────────────
router.get('/trainee/:traineeId', requireAuth, requireRole('coach', 'admin'), async (req, res, next) => {
  try {
    const trainee = await User.findById(req.params.traineeId);
    if (!trainee || trainee.role !== 'trainee') return res.status(404).json({ error: 'Trainee not found.' });
    if (req.user.role !== 'admin' && String(trainee.coach) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your trainee.' });
    }
    const plan = await NutritionPlan.findOne({ trainee: req.params.traineeId, active: true });
    return res.json({ plan: plan || null });
  } catch (err) {
    return next(err);
  }
});

// ─── Coach: create / full-replace a trainee's plan ─────────────────
const mealRules = [
  body('title').optional().trim().isLength({ max: 120 }),
  body('notes').optional().trim().isLength({ max: 3000 }),
  body('meals').isArray(),
  body('meals.*.name').trim().notEmpty().isLength({ max: 120 }),
  body('meals.*.mealType').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout', 'meal']),
  body('meals.*.macros.calories').optional().isFloat({ min: 0 }),
  body('meals.*.macros.protein').optional().isFloat({ min: 0 }),
  body('meals.*.macros.carbs').optional().isFloat({ min: 0 }),
  body('meals.*.macros.fat').optional().isFloat({ min: 0 }),
  body('meals.*.macros.fiber').optional().isFloat({ min: 0 }),
];

function sanitizeMeals(meals) {
  return (meals || []).slice(0, 30).map((m) => ({
    name:         (m.name || 'Meal').toString().slice(0, 120),
    mealType:     ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout', 'meal'].includes(m.mealType) ? m.mealType : 'meal',
    time:         (m.time || '').toString().slice(0, 20),
    ingredients:  (m.ingredients || []).slice(0, 40).map((ing) => ({
      name:   (ing.name || '').toString().slice(0, 80),
      amount: (ing.amount || '').toString().slice(0, 40),
    })),
    instructions: (m.instructions || '').toString().slice(0, 5000),
    videoUrl:     (m.videoUrl || '').toString().slice(0, 500),
    notes:        (m.notes || '').toString().slice(0, 1000),
    macros: {
      calories: Math.max(0, Number(m.macros?.calories) || 0),
      protein:  Math.max(0, Number(m.macros?.protein)  || 0),
      carbs:    Math.max(0, Number(m.macros?.carbs)    || 0),
      fat:      Math.max(0, Number(m.macros?.fat)      || 0),
      fiber:    Math.max(0, Number(m.macros?.fiber)    || 0),
    },
  }));
}

router.put('/trainee/:traineeId', requireAuth, requireRole('coach', 'admin'), mealRules, validate, async (req, res, next) => {
  try {
    const trainee = await User.findById(req.params.traineeId);
    if (!trainee || trainee.role !== 'trainee') return res.status(404).json({ error: 'Trainee not found.' });
    if (req.user.role !== 'admin' && String(trainee.coach) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your trainee.' });
    }

    const { title, notes, meals } = req.body;
    const plan = await NutritionPlan.findOneAndUpdate(
      { trainee: req.params.traineeId, active: true },
      {
        $set: {
          coach:  req.user._id,
          title:  (title || 'Nutrition Plan').toString().slice(0, 120),
          notes:  (notes || '').toString().slice(0, 3000),
          meals:  sanitizeMeals(meals),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ plan });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
