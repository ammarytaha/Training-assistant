const mongoose = require('mongoose');
const { Schema } = mongoose;

// A reusable meal the coach saves to their personal library.
// They can add it to any trainee's nutrition plan in one click.
const mealTemplateSchema = new Schema(
  {
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:         { type: String, required: true, trim: true },
    mealType:     { type: String, default: 'meal', enum: ['breakfast','lunch','dinner','snack','pre-workout','post-workout','meal'] },
    time:         { type: String, default: '' },
    ingredients:  { type: [{ name: String, amount: String }], default: [] },
    instructions: { type: String, default: '' },
    videoUrl:     { type: String, default: '' },
    notes:        { type: String, default: '' },
    macros: {
      calories: { type: Number, default: 0 },
      protein:  { type: Number, default: 0 },
      carbs:    { type: Number, default: 0 },
      fat:      { type: Number, default: 0 },
      fiber:    { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealTemplate', mealTemplateSchema);
