const express = require('express');
const { body } = require('express-validator');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/sessions/me  -> this trainee's history (most recent first)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const sessions = await Session.find({ trainee: req.user._id }).sort({ date: -1 }).limit(120);
    return res.json({ sessions });
  } catch (err) {
    return next(err);
  }
});

// POST /api/sessions  -> log (or replace) a finished workout for a date
router.post(
  '/',
  requireAuth,
  [
    body('date').isISO8601().withMessage('Valid date required.'),
    body('setsCompleted').isInt({ min: 0 }).withMessage('setsCompleted must be a number.'),
    body('setsTotal').isInt({ min: 0 }).withMessage('setsTotal must be a number.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { date, name, scheduledWorkoutId, setsCompleted, setsTotal, perExercise } = req.body;

      // Upsert: one session per trainee/date.
      const session = await Session.findOneAndUpdate(
        { trainee: req.user._id, date },
        {
          trainee: req.user._id,
          date,
          name: name || '',
          scheduledWorkout: scheduledWorkoutId || null,
          setsCompleted,
          setsTotal,
          perExercise: perExercise || {},
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Alert the trainee's coach (best-effort — never block the log).
      if (req.user.coach) {
        try {
          const label = name ? `“${name}”` : 'a workout';
          await Notification.create({
            coach: req.user.coach,
            trainee: req.user._id,
            type: 'session',
            text: `${req.user.name} completed ${label} — ${setsCompleted}/${setsTotal} sets`,
          });
        } catch {
          /* notification failures must not affect the response */
        }
      }

      return res.status(201).json({ session });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
