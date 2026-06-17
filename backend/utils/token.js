const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COOKIE_NAME = 'access_token';

// Sign a JWT carrying the minimal claims we need to identify a user.
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// Set the JWT as a secure, httpOnly cookie.
// `remember` extends the cookie lifetime; otherwise it is a session cookie.
function setAuthCookie(res, token, remember = true) {
  const maxAge = env.cookieMaxAgeDays * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // JS cannot read it -> mitigates XSS token theft
    secure: env.isProd, // HTTPS-only in production
    sameSite: env.isProd ? 'none' : 'lax', // cross-site in prod (separate domains)
    maxAge: remember ? maxAge : undefined, // undefined => session cookie
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/',
  });
}

module.exports = { COOKIE_NAME, signToken, verifyToken, setAuthCookie, clearAuthCookie };
