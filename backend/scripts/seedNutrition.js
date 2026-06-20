// Seed a 3-meal/day nutrition plan for the first trainee found in the DB.
// Run: node backend/scripts/seedNutrition.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const NutritionPlan = require('../models/NutritionPlan');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[db] connected');

  const trainee = await User.findOne({ role: 'trainee' }).sort({ createdAt: 1 });
  if (!trainee) { console.error('No trainee found.'); process.exit(1); }
  const coach = trainee.coach ? await User.findById(trainee.coach) : null;
  console.log(`[seed] trainee: ${trainee.name} (${trainee.email})`);

  await NutritionPlan.deleteMany({ trainee: trainee._id });

  await NutritionPlan.create({
    trainee: trainee._id,
    coach: coach?._id || null,
    title: 'Calisthenics Lean Muscle Plan',
    notes: 'Eat every 3-4 hours to keep energy stable. Drink at least 2.5L of water daily. Prep your meals the night before to make mornings easier.',
    active: true,
    meals: [
      {
        name: 'High-Protein Oatmeal Bowl',
        mealType: 'breakfast',
        time: '7:30 AM',
        ingredients: [
          { name: 'Rolled oats',         amount: '80g' },
          { name: 'Whey protein powder', amount: '30g (1 scoop)' },
          { name: 'Banana',              amount: '1 medium' },
          { name: 'Almond butter',       amount: '1 tbsp' },
          { name: 'Honey',               amount: '1 tsp' },
          { name: 'Skim milk',           amount: '200ml' },
          { name: 'Chia seeds',          amount: '1 tsp' },
        ],
        instructions: `1. Bring milk to a gentle simmer in a saucepan over medium heat.
2. Add oats and stir constantly for 3-4 minutes until thick and creamy.
3. Remove from heat and immediately stir in the protein powder — do this off heat so it doesn't clump.
4. Pour into a bowl and top with sliced banana, a drizzle of almond butter, honey, and chia seeds.
5. Eat within 10 minutes while it's warm and the oats are at their best texture.`,
        videoUrl: 'https://www.youtube.com/watch?v=C_8S6J6p3kI',
        notes: 'This is your pre-training fuel if you train in the morning. Eat 60-90 min before your session. You can swap whey for a plant protein if you prefer.',
        macros: { calories: 520, protein: 38, carbs: 65, fat: 10, fiber: 7 },
      },
      {
        name: 'Grilled Chicken & Brown Rice',
        mealType: 'lunch',
        time: '1:00 PM',
        ingredients: [
          { name: 'Chicken breast',    amount: '180g (raw)' },
          { name: 'Brown rice',        amount: '80g (dry)' },
          { name: 'Broccoli',          amount: '150g' },
          { name: 'Olive oil',         amount: '1 tbsp' },
          { name: 'Garlic powder',     amount: '½ tsp' },
          { name: 'Paprika',           amount: '½ tsp' },
          { name: 'Salt & pepper',     amount: 'to taste' },
          { name: 'Lemon',             amount: '½ (juice)' },
        ],
        instructions: `1. Cook brown rice according to package instructions (usually 30-35 min). Season with a pinch of salt.
2. While rice cooks, pat the chicken dry with paper towel — this is key for a good sear.
3. Season both sides of the chicken with garlic powder, paprika, salt and pepper.
4. Heat olive oil in a pan over medium-high heat until shimmering.
5. Cook chicken 5-6 min per side until golden and the internal temp hits 75°C (165°F).
6. Rest the chicken 3 minutes before slicing — don't skip this or the juices run out.
7. Steam broccoli for 4-5 min until bright green and just tender.
8. Plate: rice base, sliced chicken on top, broccoli on the side. Squeeze lemon over everything.`,
        videoUrl: 'https://www.youtube.com/watch?v=0LNiV4t2fBo',
        notes: 'This is your biggest meal. Eat it 3+ hours before training. Prep a double batch on Sunday — it keeps 4 days in the fridge. Brown rice can be swapped for sweet potato.',
        macros: { calories: 610, protein: 52, carbs: 72, fat: 11, fiber: 6 },
      },
      {
        name: 'Salmon with Roasted Vegetables',
        mealType: 'dinner',
        time: '7:30 PM',
        ingredients: [
          { name: 'Salmon fillet',     amount: '150g' },
          { name: 'Zucchini',          amount: '1 medium' },
          { name: 'Bell pepper',       amount: '1 medium' },
          { name: 'Cherry tomatoes',   amount: '100g' },
          { name: 'Olive oil',         amount: '1 tbsp' },
          { name: 'Dried oregano',     amount: '1 tsp' },
          { name: 'Garlic cloves',     amount: '2, minced' },
          { name: 'Salt & pepper',     amount: 'to taste' },
          { name: 'Lemon',             amount: '1 (zest + juice)' },
        ],
        instructions: `1. Preheat oven to 200°C (390°F).
2. Chop zucchini and bell pepper into bite-sized pieces. Toss with tomatoes, garlic, half the olive oil, oregano, salt and pepper.
3. Spread vegetables on a baking tray and roast 15 minutes until starting to soften.
4. Push vegetables to the sides and place the salmon fillet skin-side down in the center.
5. Drizzle salmon with remaining olive oil, lemon zest, salt and pepper.
6. Roast everything together for a further 12-15 minutes until salmon flakes easily with a fork.
7. Finish with a squeeze of fresh lemon juice and serve straight from the tray.`,
        videoUrl: 'https://www.youtube.com/watch?v=5IKiXgKqjCk',
        notes: 'Salmon is your omega-3 hit for the day — great for recovery and joint health. If salmon is too expensive, swap for mackerel or trout. Eat at least 2 hours before bed.',
        macros: { calories: 480, protein: 42, carbs: 18, fat: 24, fiber: 5 },
      },
    ],
  });

  const total = { calories: 520 + 610 + 480, protein: 38 + 52 + 42, carbs: 65 + 72 + 18, fat: 10 + 11 + 24 };
  console.log(`[seed] Plan created for ${trainee.name}`);
  console.log(`[seed] Daily totals: ${total.calories} kcal | ${total.protein}g protein | ${total.carbs}g carbs | ${total.fat}g fat`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
