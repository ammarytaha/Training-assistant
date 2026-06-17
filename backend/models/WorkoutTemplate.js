const mongoose = require('mongoose');

const { Schema } = mongoose;

// One exercise inside a template/scheduled workout.
const exerciseSchema = new Schema(
  {
    key: { type: String, required: true }, // stable id within the workout (set tracking)
    name: { type: String, required: true, trim: true },
    reps: { type: String, default: '' }, // free text: "5 reps", "30 sec"
    sets: { type: Number, default: 3, min: 0, max: 30 },
    info: { type: String, default: '' }, // coaching cues
    videoUrl: { type: String, default: '' }, // YouTube link only
  },
  { _id: false }
);

// A reusable workout the coach builds once and assigns to many calendar dates.
const workoutTemplateSchema = new Schema(
  {
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "Pull A"
    tag: { type: String, default: '' },
    isSuperset: { type: Boolean, default: false },
    rounds: { type: Number, default: 0 },
    exercises: { type: [exerciseSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutTemplate', workoutTemplateSchema);
module.exports.exerciseSchema = exerciseSchema;
