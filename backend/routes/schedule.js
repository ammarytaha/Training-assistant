const express = require('express');
const ScheduledWorkout = require('../models/ScheduledWorkout');
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().split('T')[0];
}

// GET /api/schedule/me?from=&to=  -> this trainee's scheduled workouts in range
// plus the sessions in that range (so the UI can show done/not-done per day).
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = from && to ? { date: { $gte: from, $lte: to } } : {};
    const [schedule, sessions] = await Promise.all([
      ScheduledWorkout.find({ trainee: req.user._id, ...range }).sort({ date: 1 }),
      Session.find({ trainee: req.user._id, ...range }),
    ]);
    return res.json({ schedule, sessions });
  } catch (err) {
    return next(err);
  }
});

// GET /api/schedule/today -> the workout assigned for today (or null = rest day)
router.get('/today', requireAuth, async (req, res, next) => {
  try {
    const date = todayISO();
    const [workout, session] = await Promise.all([
      ScheduledWorkout.findOne({ trainee: req.user._id, date }),
      Session.findOne({ trainee: req.user._id, date }),
    ]);
    return res.json({ date, workout, session });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
