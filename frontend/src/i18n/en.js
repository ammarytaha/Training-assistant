const en = {
  // Common
  save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
  close: 'Close', back: 'Back', loading: 'Loading…', saving: 'Saving…',
  logout: 'Log out', add: 'Add', new: 'New', done: '✓ Done',
  remove: 'Remove', assign: 'Assign', assigning: 'Assigning…',
  from: 'From', to: 'To', yes: 'Yes', no: 'No',

  // Tabs – trainee
  tab_train: 'Train', tab_progress: 'Progress', tab_skills: 'Skills',
  tab_chat: 'Chat', tab_nutrition: 'Nutrition',

  // Tabs – coach (top-level)
  tab_trainees: 'Trainees', tab_mealLibrary: 'Meal Library',
  // Tabs – coach (per-trainee)
  tab_calendar: 'Calendar', tab_templates: 'Templates',

  // ── Trainee dashboard ─────────────────────────────────────────────
  thisWeek: 'This Week',
  dayStreak: (n) => `${n}-DAY STREAK`,
  today: 'Today', upcoming: 'Upcoming', recentSessions: 'Recent Sessions',
  noSessionsYet: 'No sessions yet. Your scheduled workouts will appear above.',
  restDay: 'Rest day', restDayNote: 'Nothing scheduled for today. Recover well.',
  startWorkout: 'Start workout →', reviewRelog: 'Review / re-log →',
  doneToday: '✓ Done', donePrefix: '✓ Done today:',
  todayPrefix: 'Today:', exercises: 'exercises',
  loadingSchedule: 'Loading your schedule…',
  yourCoach: 'Your coach', aiCoach: 'AI Coach',
  workoutLogged: 'WORKOUT LOGGED ✓', progressSaved: 'PROGRESS SAVED',
  restDayToday: 'Rest day today',
  exercisesCount: (n) => `${n} exercises ›`,
  coachNoteLabel: 'Coach',

  // ── Workout tracker ───────────────────────────────────────────────
  upcomingPreview: 'Upcoming — preview only. Come back on the day to log it.',
  set: 'Set', reps: 'reps', rounds: 'rounds', sets: 'sets', completed: 'completed',
  completeWorkout: 'Complete Workout ✓', finishWorkout: 'Finish Workout',
  allRoundsComplete: 'All Rounds Complete',
  roundCompleteOf: (r, total) => `Round Complete → (${r}/${total})`,
  howItWorks: 'How it works',
  supersetDesc: (n, rounds) =>
    `No rest between exercises within a round. Move straight through all ${n} exercises — that's one round. Complete ${rounds} rounds; keep rest between rounds short.`,

  // ── Exercise modal ────────────────────────────────────────────────
  formNotes: 'Form Notes', noFormNotes: 'No form notes yet for this exercise.',
  stepPhotos: 'Step photos',

  // ── Progress tab ──────────────────────────────────────────────────
  allTime: 'All-time', sessions: 'Sessions', setsLogged: 'Sets logged',
  completion: 'Completion', exerciseHistory: 'Exercise History',
  sessionNotes: 'Session Notes', leaveNoteHint: 'Leave a note for this session…',
  saveNote: 'Save note', savedNote: 'Saved ✓',
  noLoggedSessions: 'No logged sessions yet.',

  // ── Nutrition – trainee view ──────────────────────────────────────
  yourPlan: 'Your plan', dailyTotals: 'Daily totals',
  noPlanYet: 'No nutrition plan yet',
  noPlanDesc: "Your coach hasn't assigned a meal plan yet. Ask them via the Chat tab.",
  ingredients: 'Ingredients', howToPrepare: 'How to prepare',
  videoTutorial: 'Video tutorial', coachLabel: 'Coach',
  mealType_breakfast: '🌅 Breakfast', mealType_lunch: '☀️ Lunch',
  mealType_dinner: '🌙 Dinner', mealType_snack: '🥜 Snack',
  mealType_preWorkout: '⚡ Pre-workout', mealType_postWorkout: '💪 Post-workout',
  mealType_meal: '🍽 Meal',

  // ── Macros ────────────────────────────────────────────────────────
  calories: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', fiber: 'Fiber',

  // ── Coach dashboard – main page ───────────────────────────────────
  yourTraineesCount: (n) => `Your Trainees · ${n}`,
  needAttentionCount: (n) => `${n} need attention`,
  attention: 'Attention',
  neverTrained: 'never trained', yesterday: 'yesterday',
  daysAgo: (n) => `${n}d ago`,
  noTraineesYet: 'No trainees yet',
  noTraineesDesc: 'Share your invite link and clients who sign up will appear here automatically.',
  getInviteLink: 'Get your invite link', inviteBtn: '+ Invite',
  streakLabel: 'streak', completionLabel: 'completion', lastSession: 'last session',

  // ── Coach calendar ────────────────────────────────────────────────
  prevMonth: '‹ Prev', nextMonth: 'Next ›',
  fillMonthBtn: '↻ Fill month — repeat on weekdays',
  noWorkoutDay: 'No workout scheduled. Assign one:',
  editThisDay: 'Edit this day',
  buildCustom: '+ Build a custom workout for this day',
  saveDay: 'Save day', assignCustom: 'Assign custom',
  repeatOnWeekdays: 'Repeat on weekdays',
  repeatDesc: 'Pick a workout, the weekdays, and a date range. Every matching day gets assigned.',
  workoutLabel: 'Workout', weekdaysLabel: 'Weekdays',
  fromLabel: 'From', toLabel: 'To',
  assignedDays: (n) => `Assigned to ${n} day(s).`,

  // ── Templates tab ─────────────────────────────────────────────────
  newTemplate: '+ New template', saveTemplate: 'Save template',
  noExercisesLabel: 'No exercises',
  editingLabel: (name) => `Edit: ${name}`,
  newTemplateLabel: 'New template',

  // ── Skills tab ────────────────────────────────────────────────────
  newSkill: '+ New skill', saveSkill: 'Save skill',
  loadingSkills: 'loading skills…',
  skillsDesc: (name) => `These are the progressions ${name} works on. Add or edit skills and steps — they update live in their app.`,
  stepsInfo: (steps, done, total) => `${steps} steps · trainee at ${done}/${total}`,

  // ── Meal library ──────────────────────────────────────────────────
  mealLibrary: 'Meal Library', myMeals: 'My Meals',
  saveToLibrary: 'Save to library', fromLibrary: '+ From Library',
  fromScratch: '+ From Scratch', addToPlan: 'Add to plan',
  noLibraryMeals: 'Your library is empty. Save meals here to reuse them across trainees.',
  manageLibrary: 'Manage Library', addMeal: 'Add meal',
  newMeal: 'New meal', mealName: 'Meal name', mealNamePlaceholder: 'e.g. Post-workout bowl',
  mealTypelabel: 'Type', suggestedTime: 'Suggested time',
  macrosLabel: 'Macros', ingredientsLabel: 'Ingredients',
  ingredientPlaceholder: 'Ingredient', amountPlaceholder: '100g',
  instructions: 'Preparation instructions',
  instructionsPlaceholder: 'Step-by-step cooking instructions…',
  videoLabel: 'Video URL (YouTube)', videoPlaceholder: 'https://youtube.com/watch?v=…',
  notesLabel: 'Notes to trainee', notesPlaceholder: 'Meal timing tips, substitutions…',
  planTitle: 'Plan title', planTitlePlaceholder: 'e.g. Lean Bulk Plan',
  overallNotes: 'Overall notes to trainee',
  overallNotesPlaceholder: 'Timing tips, hydration reminders, general guidance…',
  dailyTotalsLabel: 'Daily totals', mealsCount: (n) => `Meals · ${n}`,
  noMealsYet: 'No meals yet. Add the first one above.',
  savePlan: 'Save plan', savedMark: 'Saved ✓',
};

export default en;
