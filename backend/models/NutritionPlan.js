const mongoose = require('mongoose');

const { Schema } = mongoose;

const ingredientSchema = new Schema(
  { name: { type: String, required: true }, amount: { type: String, default: '' } },
  { _id: false }
);

const macroSchema = new Schema(
  {
    calories: { type: Number, default: 0 },
    protein:  { type: Number, default: 0 }, // grams
    carbs:    { type: Number, default: 0 }, // grams
    fat:      { type: Number, default: 0 }, // grams
    fiber:    { type: Number, default: 0 }, // grams
  },
  { _id: false }
);

const mealSchema = new Schema(
  {
    name:         { type: String, required: true, trim: true },
    mealType:     { type: String, default: 'meal', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout', 'meal'] },
    time:         { type: String, default: '' },       // suggested time e.g. "7:30 AM"
    ingredients:  { type: [ingredientSchema], default: [] },
    instructions: { type: String, default: '' },       // cooking steps
    videoUrl:     { type: String, default: '' },       // YouTube link
    notes:        { type: String, default: '' },       // coach notes to trainee
    macros:       { type: macroSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const nutritionPlanSchema = new Schema(
  {
    trainee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coach:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title:   { type: String, default: 'Nutrition Plan' },
    notes:   { type: String, default: '' }, // overall plan guidance
    meals:   { type: [mealSchema], default: [] },
    active:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NutritionPlan', nutritionPlanSchema);
