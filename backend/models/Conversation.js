const mongoose = require('mongoose');

const { Schema } = mongoose;

// Stored chat history between a trainee and the AI coach.
const messageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
