const mongoose = require('mongoose');

const { Schema } = mongoose;

// One logged workout for a trainee on a given date. With calendar scheduling
// there is at most one workout per day, so a session is keyed by (trainee, date).
const sessionSchema = new Schema(
  {
    trainee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // ISO yyyy-mm-dd
    name: { type: String, default: '' }, // the scheduled workout's name
    scheduledWorkout: { type: Schema.Types.ObjectId, ref: 'ScheduledWorkout', default: null },
    setsCompleted: { type: Number, default: 0 },
    setsTotal: { type: Number, default: 0 },
    // Optional per-exercise breakdown { exKey: count, ... } or { rounds: n }.
    perExercise: { type: Schema.Types.Mixed, default: {} },
    coachNote: { type: String, default: '' },
  },
  { timestamps: true }
);

// One session per trainee per day (re-finishing replaces it).
sessionSchema.index({ trainee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Session', sessionSchema);
