const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const Conversation = require('../models/Conversation');
const ScheduledWorkout = require('../models/ScheduledWorkout');
const Session = require('../models/Session');
const TraineeSkill = require('../models/TraineeSkill');
const NutritionPlan = require('../models/NutritionPlan');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { generateReply } = require('../services/coachAI');

const router = express.Router();

// Cap AI calls per user to control cost/abuse.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Slow down — too many messages. Try again in a moment.' },
});

// Keep the model prompt bounded: only send the last N turns.
const MAX_HISTORY = 20;

// GET /api/chat  -> load this user's conversation history
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const convo = await Conversation.findOne({ user: req.user._id });
    return res.json({ messages: convo ? convo.messages : [] });
  } catch (err) {
    return next(err);
  }
});

// POST /api/chat  -> send a message, get the AI coach's reply
router.post(
  '/',
  requireAuth,
  chatLimiter,
  [body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters.')],
  validate,
  async (req, res, next) => {
    try {
      const { message } = req.body;

      let convo = await Conversation.findOne({ user: req.user._id });
      if (!convo) convo = new Conversation({ user: req.user._id, messages: [] });

      convo.messages.push({ role: 'user', content: message });

      const now = new Date();
      const iso = (d) => {
        const t = new Date(d);
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
      };
      const from = iso(new Date(now.getTime() - 7 * 86400000));
      const to = iso(new Date(now.getTime() + 14 * 86400000));

      const [schedule, sessions, skills, nutritionPlan] = await Promise.all([
        ScheduledWorkout.find({ trainee: req.user._id, date: { $gte: from, $lte: to } }).sort({ date: 1 }),
        Session.find({ trainee: req.user._id }).sort({ date: -1 }).limit(8),
        TraineeSkill.find({ trainee: req.user._id }).sort({ order: 1, createdAt: 1 }),
        NutritionPlan.findOne({ trainee: req.user._id, active: true }),
      ]);

      const history = convo.messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }));

      const reply = await generateReply({
        context: { user: req.user, schedule, todayISO: iso(now), sessions, skills, nutritionPlan },
        history,
      });

      convo.messages.push({ role: 'assistant', content: reply });
      if (convo.messages.length > 200) convo.messages = convo.messages.slice(-200);
      await convo.save();

      return res.json({ reply });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
