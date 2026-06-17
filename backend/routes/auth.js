const express = require('express');
const passport = require('passport');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');
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
    const { name, email, password, role } = req.body;

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

    const user = await User.create({
      name,
      email,
      password,
      provider: 'local',
      // Only allow self-selecting "coach" if you want open signups; otherwise force trainee.
      role: role === 'coach' ? 'coach' : 'trainee',
    });

    const token = signToken(user);
    setAuthCookie(res, token, true);
    return res.status(201).json({ user });
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
  })(req, res, next);
});

// GET /auth/google/callback -> Google redirects back here.
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        const reason = encodeURIComponent('Google sign-in failed. Please try again.');
        return res.redirect(`${env.clientUrl}/login?error=${reason}`);
      }
      // Issue our own JWT cookie, then bounce back to the frontend.
      const token = signToken(user);
      setAuthCookie(res, token, true);
      return res.redirect(`${env.clientUrl}/auth/callback`);
    })(req, res, next);
  }
);

module.exports = router;
