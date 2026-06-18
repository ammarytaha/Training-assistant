const mongoose = require('mongoose');

const { Schema } = mongoose;

const stepSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    detail: { type: String, default: '', maxlength: 300 },
  },
  { _id: false }
);

// A calisthenics progression the coach has assigned to a specific trainee.
// Seeded from the global defaults on first use, then fully editable per trainee.
const traineeSkillSchema = new Schema(
  {
    trainee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coach: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, maxlength: 80 },
    group: { type: String, default: '', maxlength: 40 },
    icon: { type: String, default: '🎯', maxlength: 8 },
    blurb: { type: String, default: '', maxlength: 300 },
    steps: { type: [stepSchema], default: [] },
    // Index of the step the trainee is currently working on (== steps.length => mastered).
    currentStep: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TraineeSkill', traineeSkillSchema);
