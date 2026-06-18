const express = require('express');
const passport = require('passport');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');
const { findValidInvite } = require('../utils/invite');
const env = require('../config/env');

const router = express.Router();

// Throttle credential endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

// ─── Validation chains ──────────────────────────────────────────────
const registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters.').escape(),
  body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ─── POST /auth/register ────────────────────────────────────────────
router.post('/register', authLimiter, registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password, role, inviteToken } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      // If the email is tied to Google, guide them to that method.
      if (existing.provider === 'google') {
        return res.status(409).json({
          error: 'This email is registered with Google. Please use "Continue with Google".',
        });
      }
      return res.status(409).json({ error: 'That email is already registered.' });
    }

    // If they came through a coach's invite link, link them to that coach.
    const invite = await findValidInvite(inviteToken);
    const coachId = invite ? invite.coach : null;

    const user = await User.create({
      name,
      email,
      password,
      provider: 'local',
      // An invited user is always a trainee under that coach. Otherwise allow
      // self-selecting "coach" for open signups.
      role: coachId ? 'trainee' : role === 'coach' ? 'coach' : 'trainee',
      coach: coachId,
    });

    if (invite) {
      invite.usedCount += 1;
      await invite.save();
    }

    const token = signToken(user);
    setAuthCookie(res, token, true);
    return res.status(201).json({ user });
  } catch (err) {
    return next(err);
  }
});

// ─── GET /auth/invite/:token  (public invite preview) ───────────────
// Lets the join page show whose coaching the trainee is about to join.
router.get('/invite/:token', async (req, res, next) => {
  try {
    const invite = await findValidInvite(req.params.token);
    if (!invite) return res.status(404).json({ error: 'This invite link is invalid or has expired.' });
    const coach = await User.findById(invite.coach).select('name avatar');
    if (!coach) return res.status(404).json({ error: 'Invite owner not found.' });
    return res.json({ coach: { name: coach.name, avatar: coach.avatar } });
  } catch (err) {
    return next(err);
  }
});

// ─── POST /auth/login ───────────────────────────────────────────────
router.post('/login', authLimiter, loginRules, validate, async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;

    // Need the password field explicitly (select:false on the model).
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    if (user.provider === 'google' && !user.password) {
      return res.status(401).json({
        error: 'This account uses Google sign-in. Please use "Continue with Google".',
      });
    }

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);
    setAuthCookie(res, token, Boolean(remember));
    user.password = undefined;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

// ─── GET /auth/me  (who am I) ───────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ─── POST /auth/logout ──────────────────────────────────────────────
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out.' });
});

// ─── Google OAuth ───────────────────────────────────────────────────
// GET /auth/google  -> redirect user to Google's consent screen.
router.get('/google', (req, res, next) => {
  if (!env.google.enabled) {
    return res.status(503).json({ error: 'Google sign-in is not configured.' });
  }
  return passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
    prompt: 'select_account',
    // Carry the invite token (if any) through Google and back to the callback.
    state: typeof req.query.invite === 'string' ? req.query.invite : undefined,
  })(req, res, next);
});

// GET /auth/google/callback -> Google redirects back here.
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user) => {
      if (err || !user) {
        const reason = encodeURIComponent('Google sign-in failed. Please try again.');
        return res.redirect(`${env.clientUrl}/login?error=${reason}`);
      }
      try {
        // If they arrived via an invite link, link a coachless trainee to that coach.
        const inviteToken = typeof req.query.state === 'string' ? req.query.state : null;
        if (inviteToken && user.role === 'trainee' && !user.coach) {
          const invite = await findValidInvite(inviteToken);
          if (invite) {
            user.coach = invite.coach;
            await user.save();
            invite.usedCount += 1;
            await invite.save();
          }
        }
      } catch {
        /* linking is best-effort; never block sign-in */
      }
      // Issue our own JWT cookie, then bounce back to the frontend.
      const token = signToken(user);
      setAuthCookie(res, token, true);
      return res.redirect(`${env.clientUrl}/auth/callback`);
    })(req, res, next);
  }
);

module.exports = router;
