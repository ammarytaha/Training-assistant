const express = require('express');
const Notification = require('../models/Notification');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('coach', 'admin'));

// GET /api/notifications -> recent alerts + unread count for this coach.
router.get('/', async (req, res, next) => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find({ coach: req.user._id }).sort({ createdAt: -1 }).limit(40).lean(),
      Notification.countDocuments({ coach: req.user._id, read: false }),
    ]);
    return res.json({ notifications: items, unread });
  } catch (err) {
    return next(err);
  }
});

// POST /api/notifications/read -> mark all (or one) as read.
router.post('/read', async (req, res, next) => {
  try {
    const filter = { coach: req.user._id, read: false };
    if (req.body.id) filter._id = req.body.id;
    await Notification.updateMany(filter, { $set: { read: true } });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
