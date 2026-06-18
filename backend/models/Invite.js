const mongoose = require('mongoose');

const { Schema } = mongoose;

// A reusable invite link owned by a coach. Anyone who signs up through the
// link (email/password or Google) is auto-linked to that coach as a trainee.
// A coach has at most one active invite at a time; regenerating rotates it.
const inviteSchema = new Schema(
  {
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    active: { type: Boolean, default: true },
    // null => never expires.
    expiresAt: { type: Date, default: null },
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Is this invite currently usable?
inviteSchema.methods.isValid = function isValid() {
  if (!this.active) return false;
  if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return false;
  return true;
};

module.exports = mongoose.model('Invite', inviteSchema);
