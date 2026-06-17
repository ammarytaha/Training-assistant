const express = require('express');
const Plan = require('../models/Plan');
const { requireAuth } = require('../middleware/auth');
const { defaultDays } = require('../data/defaultPlan');

const router = express.Router();

// GET /api/plans/me
// Returns the current trainee's active plan, creating a default one on first use.
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    let plan = await Plan.findOne({ trainee: req.user._id, active: true });
    if (!plan) {
      plan = await Plan.create({
        trainee: req.user._id,
        coach: req.user.coach || null,
        days: defaultDays(),
      });
    }
    return res.json({ plan });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
