const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const DirectMessage = require('../models/DirectMessage');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth);

// Resolve the (coach, trainee) thread for the current user + the other party.
// Returns { coach, trainee, me } or { error, status }.
async function resolvePair(req, otherId) {
  if (req.user.role === 'trainee') {
    if (!req.user.coach) return { error: 'You have not been linked to a coach yet.', status: 400 };
    if (String(req.user.coach) !== String(otherId)) {
      return { error: 'You can only message your coach.', status: 403 };
    }
    return { coach: req.user.coach, trainee: req.user._id, me: 'trainee' };
  }
  // coach / admin
  const trainee = await User.findById(otherId).select('coach role');
  if (!trainee || trainee.role !== 'trainee') return { error: 'Trainee not found.', status: 404 };
  if (req.user.role !== 'admin' && String(trainee.coach) !== String(req.user._id)) {
    return { error: 'This trainee is not assigned to you.', status: 403 };
  }
  return { coach: req.user._id, trainee: trainee._id, me: 'coach' };
}

// GET /api/messages/thread/:otherId -> full thread, and mark my side read.
router.get('/thread/:otherId', async (req, res, next) => {
  try {
    const pair = await resolvePair(req, req.params.otherId);
    if (pair.error) return res.status(pair.status).json({ error: pair.error });

    const filter = { coach: pair.coach, trainee: pair.trainee };
    const messages = await DirectMessage.find(filter).sort({ createdAt: 1 }).limit(500).lean();

    // Mark the messages the OTHER side sent as read by me.
    const readField = pair.me === 'coach' ? 'readByCoach' : 'readByTrainee';
    await DirectMessage.updateMany({ ...filter, [readField]: false }, { $set: { [readField]: true } });

    return res.json({ me: pair.me, messages });
  } catch (err) {
    return next(err);
  }
});

// POST /api/messages/thread/:otherId -> send a message.
router.post(
  '/thread/:otherId',
  [body('text').trim().isLength({ min: 1, max: 2000 }).withMessage('Message cannot be empty.')],
  validate,
  async (req, res, next) => {
    try {
      const pair = await resolvePair(req, req.params.otherId);
      if (pair.error) return res.status(pair.status).json({ error: pair.error });

      const message = await DirectMessage.create({
        coach: pair.coach,
        trainee: pair.trainee,
        sender: pair.me,
        text: req.body.text.trim(),
        readByCoach: pair.me === 'coach',
        readByTrainee: pair.me === 'trainee',
      });

      return res.status(201).json({ message });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/messages/unread -> unread counts for the current user.
// trainee: { total }. coach: { total, byTrainee: { id: count } }.
router.get('/unread', async (req, res, next) => {
  try {
    if (req.user.role === 'trainee') {
      const total = await DirectMessage.countDocuments({
        trainee: req.user._id,
        sender: 'coach',
        readByTrainee: false,
      });
      return res.json({ total });
    }

    const unread = await DirectMessage.find({
      coach: req.user._id,
      sender: 'trainee',
      readByCoach: false,
    }).select('trainee').lean();

    const byTrainee = {};
    for (const m of unread) {
      const id = String(m.trainee);
      byTrainee[id] = (byTrainee[id] || 0) + 1;
    }
    return res.json({ total: unread.length, byTrainee });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
