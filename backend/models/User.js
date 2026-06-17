const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Only set for local (email/password) accounts. OAuth users have no password.
    password: {
      type: String,
      default: null,
      select: false, // never returned by default queries
    },
    // Which sign-in method created/owns this account.
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    // Provider's unique user id (e.g. Google "sub"). Null for local accounts.
    providerId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    // App role. A coach can manage assigned trainees' plans.
    role: {
      type: String,
      enum: ['trainee', 'coach', 'admin'],
      default: 'trainee',
    },
    // The coach who owns this trainee's programming (trainees only).
    coach: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Optional bodyweight log: [{ date, kg }]
    bodyweightLog: [
      {
        date: { type: String }, // ISO yyyy-mm-dd
        kg: { type: Number },
        _id: false,
      },
    ],
    // Skill-tree progress: { [skillId]: currentStepIndex }, e.g. { planche: 2 }.
    skillProgress: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before save, only when it changed and is present (local users).
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// Compare a plaintext password against the stored hash.
userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
