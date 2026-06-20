const express = require('express');
const { body } = require('express-validator');
const MealTemplate = require('../models/MealTemplate');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(requireAuth, requireRole('coach', 'admin'));

const VALID_TYPES = ['breakfast','lunch','dinner','snack','pre-workout','post-workout','meal'];

function sanitize(body) {
  return {
    name:         (body.name || 'Meal').toString().slice(0, 120),
    mealType:     VALID_TYPES.includes(body.mealType) ? body.mealType : 'meal',
    time:         (body.time || '').toString().slice(0, 20),
    ingredients:  (body.ingredients || []).slice(0, 40).map((i) => ({
      name: (i.name || '').toString().slice(0, 80),
      amount: (i.amount || '').toString().slice(0, 40),
    })),
    instructions: (body.instructions || '').toString().slice(0, 5000),
    videoUrl:     (body.videoUrl || '').toString().slice(0, 500),
    notes:        (body.notes || '').toString().slice(0, 1000),
    macros: {
      calories: Math.max(0, Number(body.macros?.calories) || 0),
      protein:  Math.max(0, Number(body.macros?.protein)  || 0),
      carbs:    Math.max(0, Number(body.macros?.carbs)    || 0),
      fat:      Math.max(0, Number(body.macros?.fat)      || 0),
      fiber:    Math.max(0, Number(body.macros?.fiber)    || 0),
    },
  };
}

const rules = [
  body('name').trim().notEmpty().isLength({ max: 120 }),
];

// GET  /api/coach/meal-library
router.get('/', async (req, res, next) => {
  try {
    const meals = await MealTemplate.find({ coach: req.user._id }).sort({ createdAt: -1 });
    return res.json({ meals });
  } catch (err) { return next(err); }
});

// POST /api/coach/meal-library
router.post('/', rules, validate, async (req, res, next) => {
  try {
    const meal = await MealTemplate.create({ coach: req.user._id, ...sanitize(req.body) });
    return res.status(201).json({ meal });
  } catch (err) { return next(err); }
});

// PUT  /api/coach/meal-library/:id
router.put('/:id', rules, validate, async (req, res, next) => {
  try {
    const meal = await MealTemplate.findOneAndUpdate(
      { _id: req.params.id, coach: req.user._id },
      sanitize(req.body),
      { new: true }
    );
    if (!meal) return res.status(404).json({ error: 'Not found.' });
    return res.json({ meal });
  } catch (err) { return next(err); }
});

// DELETE /api/coach/meal-library/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await MealTemplate.findOneAndDelete({ _id: req.params.id, coach: req.user._id });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
});

module.exports = router;
