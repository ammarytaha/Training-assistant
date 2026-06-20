const ar = {
  // Common
  save: 'حفظ', cancel: 'إلغاء', edit: 'تعديل', delete: 'حذف',
  close: 'إغلاق', back: 'رجوع', loading: 'جاري التحميل…', saving: 'جاري الحفظ…',
  logout: 'تسجيل الخروج', add: 'إضافة', new: 'جديد', done: '✓ تم',
  remove: 'حذف', assign: 'تعيين', assigning: 'جاري التعيين…',
  from: 'من', to: 'إلى', yes: 'نعم', no: 'لا',

  // Tabs – trainee
  tab_train: 'تدريب', tab_progress: 'التقدم', tab_skills: 'المهارات',
  tab_chat: 'المحادثة', tab_nutrition: 'التغذية',

  // Tabs – coach (top-level)
  tab_trainees: 'المتدربون', tab_mealLibrary: 'مكتبة الوجبات',
  // Tabs – coach (per-trainee)
  tab_calendar: 'التقويم', tab_templates: 'القوالب',

  // ── Trainee dashboard ─────────────────────────────────────────────
  thisWeek: 'هذا الأسبوع',
  dayStreak: (n) => `${n} يوم متواصل`,
  today: 'اليوم', upcoming: 'القادم', recentSessions: 'الجلسات الأخيرة',
  noSessionsYet: 'لا جلسات بعد. ستظهر تمارينك المجدولة هنا.',
  restDay: 'يوم راحة', restDayNote: 'لا يوجد تمرين اليوم. استرح جيداً.',
  startWorkout: 'ابدأ التمرين ←', reviewRelog: 'مراجعة / إعادة تسجيل ←',
  doneToday: '✓ تم', donePrefix: '✓ أنجزت اليوم:',
  todayPrefix: 'اليوم:', exercises: 'تمارين',
  loadingSchedule: 'جاري تحميل جدولك…',
  yourCoach: 'مدربك', aiCoach: 'مدرب الذكاء',
  workoutLogged: 'تم تسجيل التمرين ✓', progressSaved: 'تم حفظ التقدم',
  restDayToday: 'يوم راحة اليوم',
  exercisesCount: (n) => `${n} تمارين ›`,
  coachNoteLabel: 'المدرب',

  // ── Workout tracker ───────────────────────────────────────────────
  upcomingPreview: 'قادم — معاينة فقط. عد في اليوم المحدد للتسجيل.',
  set: 'مجموعة', reps: 'تكرار', rounds: 'جولات', sets: 'مجموعات', completed: 'مكتمل',
  completeWorkout: 'أكمل التمرين ✓', finishWorkout: 'إنهاء التمرين',
  allRoundsComplete: 'اكتملت جميع الجولات',
  roundCompleteOf: (r, total) => `انتهت الجولة ← (${r}/${total})`,
  howItWorks: 'كيف يعمل',
  supersetDesc: (n, rounds) =>
    `لا راحة بين التمارين داخل الجولة. انتقل مباشرةً عبر ${n} تمارين — هذه جولة واحدة. أكمل ${rounds} جولات مع راحة قصيرة بينها.`,

  // ── Exercise modal ────────────────────────────────────────────────
  formNotes: 'ملاحظات الأداء', noFormNotes: 'لا توجد ملاحظات لهذا التمرين بعد.',
  stepPhotos: 'صور الخطوات',

  // ── Progress tab ──────────────────────────────────────────────────
  allTime: 'الإجمالي', sessions: 'الجلسات', setsLogged: 'المجموعات',
  completion: 'الإتمام', exerciseHistory: 'سجل التمارين',
  sessionNotes: 'ملاحظات الجلسة', leaveNoteHint: 'اترك ملاحظة على هذه الجلسة…',
  saveNote: 'حفظ الملاحظة', savedNote: 'تم الحفظ ✓',
  noLoggedSessions: 'لا توجد جلسات مسجلة بعد.',

  // ── Nutrition – trainee view ──────────────────────────────────────
  yourPlan: 'خطتك', dailyTotals: 'المجموع اليومي',
  noPlanYet: 'لا يوجد خطة غذائية بعد',
  noPlanDesc: 'لم يقم مدربك بتعيين خطة غذائية بعد. اسأله عبر تبويب المحادثة.',
  ingredients: 'المكونات', howToPrepare: 'طريقة التحضير',
  videoTutorial: 'فيديو تعليمي', coachLabel: 'المدرب',
  mealType_breakfast: '🌅 الفطور', mealType_lunch: '☀️ الغداء',
  mealType_dinner: '🌙 العشاء', mealType_snack: '🥜 وجبة خفيفة',
  mealType_preWorkout: '⚡ قبل التمرين', mealType_postWorkout: '💪 بعد التمرين',
  mealType_meal: '🍽 وجبة',

  // ── Macros ────────────────────────────────────────────────────────
  calories: 'سعرات', protein: 'بروتين', carbs: 'كربوهيدرات', fat: 'دهون', fiber: 'ألياف',

  // ── Coach dashboard – main page ───────────────────────────────────
  yourTraineesCount: (n) => `متدربوك · ${n}`,
  needAttentionCount: (n) => `${n} يحتاجون انتباهاً`,
  attention: 'انتباه',
  neverTrained: 'لم يتدرب بعد', yesterday: 'أمس',
  daysAgo: (n) => `منذ ${n} أيام`,
  noTraineesYet: 'لا يوجد متدربون بعد',
  noTraineesDesc: 'شارك رابط الدعوة وسيظهر العملاء الذين يسجلون تلقائياً هنا.',
  getInviteLink: 'احصل على رابط الدعوة', inviteBtn: '+ دعوة',
  streakLabel: 'متواصل', completionLabel: 'الإتمام', lastSession: 'آخر جلسة',

  // ── Coach calendar ────────────────────────────────────────────────
  prevMonth: '‹ السابق', nextMonth: 'التالي ›',
  fillMonthBtn: '↻ ملء الشهر — تكرار أيام الأسبوع',
  noWorkoutDay: 'لا يوجد تمرين مجدول. عيّن واحداً:',
  editThisDay: 'تعديل هذا اليوم',
  buildCustom: '+ بناء تمرين مخصص لهذا اليوم',
  saveDay: 'حفظ اليوم', assignCustom: 'تعيين مخصص',
  repeatOnWeekdays: 'تكرار في أيام الأسبوع',
  repeatDesc: 'اختر التمرين، أيام الأسبوع، ونطاق التاريخ. سيُعيَّن كل يوم مطابق.',
  workoutLabel: 'التمرين', weekdaysLabel: 'أيام الأسبوع',
  fromLabel: 'من', toLabel: 'إلى',
  assignedDays: (n) => `تم التعيين في ${n} يوم/أيام.`,

  // ── Templates tab ─────────────────────────────────────────────────
  newTemplate: '+ قالب جديد', saveTemplate: 'حفظ القالب',
  noExercisesLabel: 'لا تمارين',
  editingLabel: (name) => `تعديل: ${name}`,
  newTemplateLabel: 'قالب جديد',

  // ── Skills tab ────────────────────────────────────────────────────
  newSkill: '+ مهارة جديدة', saveSkill: 'حفظ المهارة',
  loadingSkills: 'جاري تحميل المهارات…',
  skillsDesc: (name) => `هذه هي التمارين التطورية التي يعمل عليها ${name}. أضف مهارات وخطوات — تظهر فوراً في تطبيقه.`,
  stepsInfo: (steps, done, total) => `${steps} خطوات · المتدرب عند ${done}/${total}`,

  // ── Meal library ──────────────────────────────────────────────────
  mealLibrary: 'مكتبة الوجبات', myMeals: 'وجباتي',
  saveToLibrary: 'حفظ في المكتبة', fromLibrary: '+ من المكتبة',
  fromScratch: '+ من الصفر', addToPlan: 'أضف للخطة',
  noLibraryMeals: 'المكتبة فارغة. احفظ وجبات هنا لإعادة استخدامها.',
  manageLibrary: 'إدارة المكتبة', addMeal: 'إضافة وجبة',
  newMeal: 'وجبة جديدة', mealName: 'اسم الوجبة', mealNamePlaceholder: 'مثال: وجبة ما بعد التمرين',
  mealTypelabel: 'النوع', suggestedTime: 'الوقت المقترح',
  macrosLabel: 'المغذيات', ingredientsLabel: 'المكونات',
  ingredientPlaceholder: 'مكوّن', amountPlaceholder: '100 جم',
  instructions: 'طريقة التحضير',
  instructionsPlaceholder: 'خطوات الطهي بالتفصيل…',
  videoLabel: 'رابط الفيديو (يوتيوب)', videoPlaceholder: 'https://youtube.com/watch?v=…',
  notesLabel: 'ملاحظات للمتدرب', notesPlaceholder: 'توقيت الوجبة، بدائل، تذكيرات…',
  planTitle: 'عنوان الخطة', planTitlePlaceholder: 'مثال: خطة زيادة الكتلة العضلية',
  overallNotes: 'ملاحظات عامة للمتدرب',
  overallNotesPlaceholder: 'توقيت الوجبات، شرب الماء، إرشادات عامة…',
  dailyTotalsLabel: 'المجموع اليومي', mealsCount: (n) => `الوجبات · ${n}`,
  noMealsYet: 'لا وجبات بعد. أضف أول وجبة.',
  savePlan: 'حفظ الخطة', savedMark: 'تم الحفظ ✓',
};

export default ar;
