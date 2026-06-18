const mongoose = require('mongoose');

const { Schema } = mongoose;

// An in-app alert for a coach (e.g. a trainee logged a workout). Surfaced as a
// bell with an unread count in the coach dashboard.
const notificationSchema = new Schema(
  {
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trainee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, default: 'session' },
    text: { type: String, required: true, maxlength: 300 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ coach: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
