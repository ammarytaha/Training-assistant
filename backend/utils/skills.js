const TraineeSkill = require('../models/TraineeSkill');
const { SKILLS } = require('../data/skillTree');

// Clamp + sanitise the steps array coming from a coach editor.
function normalizeSteps(steps) {
  return (Array.isArray(steps) ? steps : []).slice(0, 30).map((s) => ({
    name: (s.name || 'Step').toString().slice(0, 80),
    detail: (s.detail || '').toString().slice(0, 300),
  }));
}

// Sanitise the editable fields of a skill from a request body.
function skillSnapshot(src) {
  return {
    name: (src.name || 'Skill').toString().slice(0, 80),
    group: (src.group || '').toString().slice(0, 40),
    icon: (src.icon || '🎯').toString().slice(0, 8),
    blurb: (src.blurb || '').toString().slice(0, 300),
    steps: normalizeSteps(src.steps),
  };
}

// Ensure a trainee has their own editable skill set. On first use we seed from
// the global defaults, carrying over any progress from the legacy skillProgress
// map so nothing is lost in the migration. Returns the trainee's skills.
async function ensureSkills(user) {
  const existing = await TraineeSkill.find({ trainee: user._id }).sort({ order: 1, createdAt: 1 });
  if (existing.length > 0) return existing;

  const progress = user.skillProgress || new Map();
  const stepOf = (id) => (progress.get ? progress.get(id) : progress[id]) || 0;

  const docs = SKILLS.map((s, i) => ({
    trainee: user._id,
    coach: user.coach || null,
    name: s.name,
    group: s.group,
    icon: s.icon,
    blurb: s.blurb,
    steps: s.steps,
    currentStep: stepOf(s.id),
    order: i,
  }));
  await TraineeSkill.insertMany(docs);
  return TraineeSkill.find({ trainee: user._id }).sort({ order: 1, createdAt: 1 });
}

module.exports = { ensureSkills, skillSnapshot, normalizeSteps };
