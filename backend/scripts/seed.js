// Creates a coach account and (optionally) links existing trainees to it.
// Run once: `npm run seed` from the backend folder.
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');

const COACH = {
  name: 'Coach Ammar',
  email: 'coach@example.com',
  password: 'coach1234', // change after first login
};

(async () => {
  await mongoose.connect(env.mongoUri);
  console.log('[seed] connected');

  let coach = await User.findOne({ email: COACH.email });
  if (coach) {
    console.log('[seed] coach already exists:', coach.email);
  } else {
    coach = await User.create({ ...COACH, role: 'coach', provider: 'local' });
    console.log('[seed] created coach:', coach.email, '(password:', COACH.password + ')');
  }

  // Link any unassigned trainees to this coach so they show up on the dashboard.
  const result = await User.updateMany(
    { role: 'trainee', coach: null },
    { $set: { coach: coach._id } }
  );
  console.log(`[seed] linked ${result.modifiedCount} unassigned trainee(s) to the coach`);

  await mongoose.disconnect();
  console.log('[seed] done');
  process.exit(0);
})().catch((err) => {
  console.error('[seed] failed:', err.message);
  process.exit(1);
});
