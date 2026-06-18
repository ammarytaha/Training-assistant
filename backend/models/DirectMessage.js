const mongoose = require('mongoose');

const { Schema } = mongoose;

// One message in a coach <-> trainee thread. A thread is uniquely identified by
// the (coach, trainee) pair; `sender` records which side wrote it.
const directMessageSchema = new Schema(
  {
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trainee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: String, enum: ['coach', 'trainee'], required: true },
    text: { type: String, required: true, maxlength: 2000 },
    readByCoach: { type: Boolean, default: false },
    readByTrainee: { type: Boolean, default: false },
  },
  { timestamps: true }
);

directMessageSchema.index({ coach: 1, trainee: 1, createdAt: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
