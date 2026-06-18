const crypto = require('crypto');
const Invite = require('../models/Invite');

// 36-char URL-safe token for invite links.
function generateToken() {
  return crypto.randomBytes(18).toString('hex');
}

// Look up an invite by token and confirm it is still usable. Does NOT consume.
async function findValidInvite(token) {
  if (!token || typeof token !== 'string') return null;
  const invite = await Invite.findOne({ token });
  if (!invite || !invite.isValid()) return null;
  return invite;
}

module.exports = { generateToken, findValidInvite };
