const mongoose = require('mongoose');
const { exerciseSchema } = require('./WorkoutTemplate');

const { Schema } = mongoose;

// A workout assigned to ONE trainee on ONE calendar date. It's a snapshot:
// editing the source template later does not change days already scheduled.
const scheduledWorkoutSchema = new Schema(
  {
    trainee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coach: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    date: { type: String, required: true }, // ISO yyyy-mm-dd
    name: { type: String, required: true },
    tag: { type: String, default: '' },
    isSuperset: { type: Boolean, default: false },
    rounds: { type: Number, default: 0 },
    exercises: { type: [exerciseSchema], default: [] },
    sourceTemplate: { type: Schema.Types.ObjectId, ref: 'WorkoutTemplate', default: null },
  },
  { timestamps: true }
);

// One scheduled workout per trainee per day.
scheduledWorkoutSchema.index({ trainee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ScheduledWorkout', scheduledWorkoutSchema);
