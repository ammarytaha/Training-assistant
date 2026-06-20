const mongoose = require('mongoose');

const { Schema } = mongoose;

// A single exercise inside a day.
const exerciseSchema = new Schema(
  {
    // Stable key used by the frontend tracker (e.g. "p1").
    key: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    reps: { type: String, default: '' }, // free text: "5 reps", "30 sec"
    sets: { type: Number, default: 3, min: 0, max: 20 },
    // Coach guidance / form notes (HTML-free plain text or simple markup).
    info: { type: String, default: '' },
    // YouTube link only (embedded as URL, never downloaded).
    videoUrl: { type: String, default: '' },
    photos: { type: [String], default: [] }, // uploaded photo URLs
  },
  { _id: false }
);

// A training day (e.g. "Pull Day") or a superset circuit.
const daySchema = new Schema(
  {
    key: { type: String, required: true }, // "pull", "push", ...
    number: { type: String, default: '' }, // "01"
    name: { type: String, required: true },
    tag: { type: String, default: '' },
    preview: { type: String, default: '' },
    isSuperset: { type: Boolean, default: false },
    rounds: { type: Number, default: 0 }, // for supersets
    exercises: { type: [exerciseSchema], default: [] },
  },
  { _id: false }
);

// A full plan assigned to one trainee (built/owned by a coach).
const planSchema = new Schema(
  {
    title: { type: String, default: 'Calisthenics Program' },
    // The trainee this plan belongs to.
    trainee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // The coach who authored it (null for default/self-serve plans).
    coach: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    days: { type: [daySchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
