// Calisthenics skill progressions. Each skill is an ordered path of steps;
// a trainee's progress is the index of the step they're currently working on
// (0 = first step / not started past it). This is the structure most generic
// fitness apps lack — the AI coach reads it to suggest what's next.

const SKILLS = [
  {
    id: 'pullup',
    name: 'Pull-up → Muscle-up',
    group: 'Pull',
    icon: '🔼',
    blurb: 'From your first strict pull-up to a clean bar muscle-up.',
    steps: [
      { name: 'Dead Hang', detail: 'Hold a full hang 30+ sec with engaged scapulae.' },
      { name: 'Scapular Pull-ups', detail: '3×8 controlled scapular retractions.' },
      { name: 'Negative Pull-ups', detail: '5 sec lowering from the top, 3×5.' },
      { name: 'Strict Pull-up', detail: 'First full rep, chin over bar.' },
      { name: '8+ Strict Pull-ups', detail: 'Build to 3×8 clean reps.' },
      { name: 'Explosive Pull-ups', detail: 'Pull chest to bar with speed, 3×5.' },
      { name: 'Bar Muscle-up', detail: 'Transition over the bar to lockout.' },
    ],
  },
  {
    id: 'dips',
    name: 'Dips → Ring Dips',
    group: 'Push',
    icon: '💪',
    blurb: 'Parallel-bar strength toward unstable ring dips.',
    steps: [
      { name: 'Support Hold', detail: 'Locked-out support hold 20+ sec.' },
      { name: 'Negative Dips', detail: '5 sec lowering, 3×5.' },
      { name: 'Strict Dip', detail: 'First full-depth rep.' },
      { name: '10+ Dips', detail: 'Build to 3×10 clean reps.' },
      { name: 'Ring Support Hold', detail: 'Stable support on rings, turned out, 20 sec.' },
      { name: 'Ring Dips', detail: 'Full-depth dips on rings, 3×5.' },
    ],
  },
  {
    id: 'handstand',
    name: 'Handstand',
    group: 'Balance',
    icon: '🤸',
    blurb: 'Wall work to a freestanding handstand.',
    steps: [
      { name: 'Pike Hold', detail: 'Strong shoulders in a pike against wall.' },
      { name: 'Wall Handstand (chest-to-wall)', detail: 'Hold 30+ sec, straight line.' },
      { name: 'Heel Pulls', detail: 'Pull heels off the wall, find balance.' },
      { name: 'Kick-up to Balance', detail: 'Freestanding kick-up, brief hold.' },
      { name: '10 sec Freestanding', detail: 'Hold without wall 10 sec.' },
      { name: '30 sec Freestanding', detail: 'Consistent 30 sec hold.' },
    ],
  },
  {
    id: 'planche',
    name: 'Planche',
    group: 'Push',
    icon: '🛬',
    blurb: 'The classic straight-arm push progression.',
    steps: [
      { name: 'Planche Lean', detail: 'Lean forward in plank, scapula protracted, 20 sec.' },
      { name: 'Tuck Planche', detail: 'Knees tucked, hold off the ground 10 sec.' },
      { name: 'Advanced Tuck', detail: 'Flat back, knees tucked, 10 sec.' },
      { name: 'Straddle Planche', detail: 'Legs straddled and straight, 5 sec.' },
      { name: 'Full Planche', detail: 'Legs together, body parallel, 3 sec.' },
    ],
  },
  {
    id: 'frontlever',
    name: 'Front Lever',
    group: 'Pull',
    icon: '➖',
    blurb: 'Horizontal straight-body pulling strength.',
    steps: [
      { name: 'Tuck Front Lever', detail: 'Hang with knees tucked, body horizontal, 10 sec.' },
      { name: 'Advanced Tuck', detail: 'Flat back, knees in, 10 sec.' },
      { name: 'One-Leg Front Lever', detail: 'One leg extended, 5 sec each.' },
      { name: 'Straddle Front Lever', detail: 'Legs straddled and straight, 5 sec.' },
      { name: 'Full Front Lever', detail: 'Body fully horizontal, legs together, 3 sec.' },
    ],
  },
  {
    id: 'pistol',
    name: 'Pistol Squat',
    group: 'Legs',
    icon: '🦵',
    blurb: 'Single-leg lower-body strength and mobility.',
    steps: [
      { name: 'Deep Bodyweight Squat', detail: 'Full-depth squat, heels down, 3×15.' },
      { name: 'Assisted Pistol', detail: 'Hold support, lower on one leg, 3×5.' },
      { name: 'Box Pistol', detail: 'Sit to a box on one leg, stand back up.' },
      { name: 'Negative Pistol', detail: 'Slow lowering on one leg, 3×5.' },
      { name: 'Full Pistol Squat', detail: 'Full ROM single-leg squat, 3×5 each.' },
    ],
  },
];

const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

module.exports = { SKILLS, SKILL_BY_ID };
