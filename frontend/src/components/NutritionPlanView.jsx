import { useEffect, useState } from 'react';
import { api } from '../api';
import { useLanguage } from '../contexts/LanguageContext';
import MacroBar from './MacroBar';

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function NutritionPlanView() {
  const { t } = useLanguage();
  const [plan, setPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const TYPE_LABEL = {
    breakfast:    t('mealType_breakfast'),
    lunch:        t('mealType_lunch'),
    dinner:       t('mealType_dinner'),
    snack:        t('mealType_snack'),
    'pre-workout':  t('mealType_preWorkout'),
    'post-workout': t('mealType_postWorkout'),
    meal:         t('mealType_meal'),
  };

  useEffect(() => {
    (async () => {
      try { const d = await api.get('/api/nutrition/me'); setPlan(d.plan); }
      catch { /* ignore */ }
      setLoaded(true);
    })();
  }, []);

  if (!loaded) return <div className="text-text-dim text-xs font-mono animate-pulse py-10 text-center">{t('loading')}</div>;

  if (!plan || plan.meals.length === 0) {
    return (
      <div className="py-12 text-center bg-surface border border-border rounded-xl">
        <div className="text-4xl mb-3">🥗</div>
        <div className="font-bold">{t('noPlanYet')}</div>
        <p className="text-text-mid text-sm mt-2 px-6">{t('noPlanDesc')}</p>
      </div>
    );
  }

  const totals = plan.meals.reduce(
    (acc, m) => ({ calories:acc.calories+(m.macros?.calories||0), protein:acc.protein+(m.macros?.protein||0), carbs:acc.carbs+(m.macros?.carbs||0), fat:acc.fat+(m.macros?.fat||0), fiber:acc.fiber+(m.macros?.fiber||0) }),
    { calories:0, protein:0, carbs:0, fat:0, fiber:0 }
  );

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="text-[10px] uppercase tracking-widest text-text-mid mb-1">{t('yourPlan')}</div>
        <h2 className="text-xl font-extrabold mb-3">{plan.title}</h2>
        <MacroBar macros={totals} />
        {plan.notes && <p className="mt-3 text-sm text-text leading-relaxed border-t border-border pt-3">{plan.notes}</p>}
      </div>

      <div className="space-y-2.5">
        {plan.meals.map((meal) => {
          const isOpen = expanded === meal._id;
          const videoId = youtubeId(meal.videoUrl);
          const hasMacros = meal.macros && (meal.macros.calories || meal.macros.protein || meal.macros.carbs || meal.macros.fat);
          return (
            <div key={meal._id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <button className="w-full text-left px-4 py-3.5 flex items-center gap-3" onClick={() => setExpanded(isOpen ? null : meal._id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm truncate">{meal.name}</span>
                    {meal.time && <span className="text-[10px] text-text-dim font-mono shrink-0">{meal.time}</span>}
                  </div>
                  <div className="text-[10px] text-text-mid uppercase tracking-wide">{TYPE_LABEL[meal.mealType] || meal.mealType}</div>
                  {hasMacros && !isOpen && <div className="mt-1.5"><MacroBar macros={meal.macros} compact /></div>}
                </div>
                <span className={`text-text-dim text-lg transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
              </button>

              {isOpen && (
                <div className="border-t border-border px-4 pb-4 space-y-4 pt-3">
                  {hasMacros && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">{t('dailyTotals')}</div>
                      <MacroBar macros={meal.macros} />
                    </div>
                  )}
                  {videoId && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">{t('videoTutorial')}</div>
                      <div className="rounded-xl overflow-hidden border border-border" style={{ aspectRatio: '16/9' }}>
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title={meal.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="block" />
                      </div>
                    </div>
                  )}
                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">{t('ingredients')}</div>
                      <div className="space-y-0">
                        {meal.ingredients.map((ing, i) => (
                          <div key={i} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 text-sm">
                            <span>{ing.name}</span>
                            {ing.amount && <span className="font-mono text-xs text-accent">{ing.amount}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {meal.instructions && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">{t('howToPrepare')}</div>
                      <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">{meal.instructions}</p>
                    </div>
                  )}
                  {meal.notes && (
                    <div className="flex gap-2 bg-warm/10 border-l-2 border-warm rounded-r px-3 py-2">
                      <span className="text-warm text-xs shrink-0 font-semibold">{t('coachLabel')}</span>
                      <p className="text-xs text-text leading-relaxed">{meal.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
