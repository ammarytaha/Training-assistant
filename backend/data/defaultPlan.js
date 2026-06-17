// The starter calisthenics program, migrated from the original index.html.
// New trainees receive a copy of this; a coach can then edit it per trainee.
// `info` is plain text here (frontend renders it safely).

function defaultDays() {
  return [
    {
      key: 'pull',
      number: '01',
      name: 'Pull Day',
      tag: 'Vertical & Horizontal Pull',
      preview: 'Pull-ups, chin-ups, hangs, core',
      isSuperset: false,
      rounds: 0,
      exercises: [
        { key: 'p1', name: 'Pull-up', reps: '5 reps', sets: 4, videoUrl: '', info: 'Overhand grip, hands shoulder-width, palms facing away. Hang fully extended, then pull up until your chin clears the bar. Lower under control. Targets lats, mid-back, biceps. Keep shoulders pulled down; avoid swinging.' },
        { key: 'p2', name: 'Dead Hang', reps: '20 sec', sets: 4, videoUrl: '', info: 'Hang with arms fully extended, supporting full bodyweight on your hands. Stay relaxed but keep scapulae somewhat engaged. Builds grip endurance and decompresses the spine.' },
        { key: 'p3', name: 'Chin-up', reps: '5 reps', sets: 4, videoUrl: '', info: 'Underhand grip, palms facing you, shoulder-width or slightly narrower. Pull until chin clears the bar. Stronger biceps involvement than a pull-up. Lower under control.' },
        { key: 'p4', name: 'Australian Pull-up', reps: '12 reps', sets: 4, videoUrl: '', info: 'Inverted row. Bar at hip height (or rings). Lie underneath, body straight, heels on the ground, arms straight. Pull chest to bar, lower under control. Trains horizontal pulling.' },
        { key: 'p5', name: 'Scapular Pull-up Hold', reps: '15 sec', sets: 4, videoUrl: '', info: 'Hang with straight arms. Without bending elbows, pull shoulder blades down and together so your body rises slightly. Hold. Trains scapular control essential for safe pull-up work.' },
        { key: 'p6', name: 'Hollow Body Hold', reps: '30 sec', sets: 5, videoUrl: '', info: 'Lie on your back, lower back pressed firmly into the floor. Lift arms overhead and legs off the ground into a shallow banana shape. Keep lower back glued down the whole time.' },
      ],
    },
    {
      key: 'push',
      number: '02',
      name: 'Push Day',
      tag: 'Chest, Shoulders, Triceps',
      preview: 'Dips, push-up variations, core',
      isSuperset: false,
      rounds: 0,
      exercises: [
        { key: 'pu1', name: 'Dips', reps: '8 reps', sets: 3, videoUrl: '', info: 'On parallel bars, arms locked out. Lower until shoulders are at about elbow height, then push back to lockout. Lean forward to bias chest, stay upright to bias triceps.' },
        { key: 'pu2', name: 'Push-up', reps: '12 reps', sets: 3, videoUrl: '', info: 'Plank, hands shoulder-width. Keep a straight line, no sagging hips. Lower chest until elbows hit ~90°, push back up.' },
        { key: 'pu3', name: 'Shoulder Taps', reps: '10 reps', sets: 3, videoUrl: '', info: 'In a push-up plank, tap opposite shoulder with each hand. 10 reps = 5 per side. Keep hips stable — anti-rotation core work.' },
        { key: 'pu4', name: 'Wide Push-up', reps: '12 reps', sets: 3, videoUrl: '', info: 'Push-up with hands wider than shoulders. Shifts emphasis to the chest. Keep movement controlled.' },
        { key: 'pu5', name: 'Scapular Push-up', reps: '20 reps', sets: 3, videoUrl: '', info: 'High plank, straight arms. Without bending elbows, let chest sink between shoulders, then push the floor away to round your upper back. Trains serratus anterior.' },
        { key: 'pu6', name: 'Pinch Dips', reps: '8 reps', sets: 3, videoUrl: '', info: 'Close-grip dips, hands closer together, elbows tucked. Shifts emphasis to the triceps.' },
        { key: 'pu7', name: 'Plank Hold', reps: '30 sec', sets: 3, videoUrl: '', info: 'Forearm plank, elbows under shoulders, straight line heels to head. Brace your core hard.' },
      ],
    },
    {
      key: 'legs',
      number: '03',
      name: 'Leg + Core',
      tag: 'Lower Body & Midline',
      preview: 'Squats, lunges, raises, holds',
      isSuperset: false,
      rounds: 0,
      exercises: [
        { key: 'l1', name: 'Lunges', reps: '12 reps', sets: 3, videoUrl: '', info: 'Step forward, lower until both knees hit ~90° (front shin vertical, back knee just off floor). Drive up through the front heel. Usually 12 per leg.' },
        { key: 'l2', name: 'Squat', reps: '15 reps', sets: 3, videoUrl: '', info: 'Feet shoulder-width, toes slightly out. Sit back, chest up, knees tracking over toes. Go to at least parallel, then drive up.' },
        { key: 'l3', name: 'Wide Squat', reps: '10 reps', sets: 3, videoUrl: '', info: 'Feet wider than shoulders, toes out ~30°. Sit straight down, knees track over toes. Hits inner thighs and glutes.' },
        { key: 'l4', name: 'Crunches', reps: '15 reps', sets: 3, videoUrl: '', info: 'On your back, knees bent. Curl shoulder blades off the floor by contracting the abs. Small range, controlled, no neck pulling.' },
        { key: 'l5', name: 'Knee Bar Raises', reps: '15 reps', sets: 3, videoUrl: '', info: 'Hang from a bar. Bring knees toward chest, control them back down without swinging. No momentum.' },
        { key: 'l6', name: 'Leg Raises', reps: '12 reps', sets: 3, videoUrl: '', info: 'Hanging (legs to horizontal) or lying (lower straight legs to just above the floor without arching). Pick the hardest version you can control.' },
        { key: 'l7', name: 'Hollow Body Hold', reps: '25 sec', sets: 3, videoUrl: '', info: 'Lower back pressed into floor, arms overhead, legs lifted, banana shape.' },
        { key: 'l8', name: 'Plank', reps: '45 sec', sets: 3, videoUrl: '', info: 'Forearm plank, longer hold. Straight line heels to head. Quality over duration — if hips drop, reset.' },
      ],
    },
    {
      key: 'superset',
      number: '04',
      name: 'Superset',
      tag: 'Circuit · No Rest Between Exercises',
      preview: '5 exercises × 6 rounds, no rest within rounds',
      isSuperset: true,
      rounds: 6,
      exercises: [
        { key: 's1', name: 'Pull-up', reps: '5 reps', sets: 1, videoUrl: '', info: '' },
        { key: 's2', name: 'Dips', reps: '5 reps', sets: 1, videoUrl: '', info: '' },
        { key: 's3', name: 'Push-up', reps: '10 reps', sets: 1, videoUrl: '', info: '' },
        { key: 's4', name: 'Squat', reps: '15 reps', sets: 1, videoUrl: '', info: '' },
        { key: 's5', name: 'Crunches', reps: '20 reps', sets: 1, videoUrl: '', info: '' },
      ],
    },
  ];
}

// Map the starter days into reusable coach templates (drops calendar-only fields
// like `number`/`preview`). A coach gets these on first use and can edit/add to them.
function defaultTemplates() {
  return defaultDays().map((d) => ({
    name: d.name,
    tag: d.tag,
    isSuperset: d.isSuperset,
    rounds: d.rounds,
    exercises: d.exercises.map((e) => ({
      key: e.key,
      name: e.name,
      reps: e.reps,
      sets: e.sets,
      info: e.info || '',
      videoUrl: e.videoUrl || '',
    })),
  }));
}

module.exports = { defaultDays, defaultTemplates };
