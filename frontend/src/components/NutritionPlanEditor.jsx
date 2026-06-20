import { useEffect, useState } from 'react';
import { api } from '../api';
import { useLanguage } from '../contexts/LanguageContext';
import MacroBar from './MacroBar';
import MealLibraryPicker from './MealLibraryPicker';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout', 'meal'];

function emptyMeal() {
  return {
    _tmpId: Math.random().toString(36).slice(2),
    name: '', mealType: 'meal', time: '',
    ingredients: [{ name: '', amount: '' }],
    instructions: '', videoUrl: '', notes: '',
    macros: { calories: '', protein: '', carbs: '', fat: '', fiber: '' },
  };
}

function numericMacros(m) {
  return {
    calories: Number(m.calories) || 0, protein: Number(m.protein) || 0,
    carbs: Number(m.carbs) || 0, fat: Number(m.fat) || 0, fiber: Number(m.fiber) || 0,
  };
}

export default function NutritionPlanEditor({ traineeId, traineeName }) {
  const { t } = useLanguage();
  const [plan, setPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [editingMeal, setEditingMeal] = useState(null); // meal | 'new' | null
  const [showLibrary, setShowLibrary] = useState(false);
  const [addMode, setAddMode] = useState(false); // show add-from options

  async function load() {
    try {
      const data = await api.get(`/api/nutrition/trainee/${traineeId}`);
      if (data.plan) {
        setPlan({
          ...data.plan,
          meals: data.plan.meals.map((m) => ({
            ...m, _tmpId: m._id || Math.random().toString(36).slice(2),
            macros: { calories: m.macros?.calories||'', protein: m.macros?.protein||'', carbs: m.macros?.carbs||'', fat: m.macros?.fat||'', fiber: m.macros?.fiber||'' },
          })),
        });
      } else {
        setPlan({ title: 'Nutrition Plan', notes: '', meals: [] });
      }
    } catch {
      setPlan({ title: 'Nutrition Plan', notes: '', meals: [] });
    }
    setLoaded(true);
  }

  useEffect(() => { load(); }, [traineeId]);

  async function save() {
    if (!plan) return;
    setSaving(true); setErr(''); setSaved(false);
    try {
      await api.put(`/api/nutrition/trainee/${traineeId}`, {
        title: plan.title, notes: plan.notes,
        meals: plan.meals.map((m) => ({ ...m, macros: numericMacros(m.macros) })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  function saveMeal(meal) {
    setPlan((p) => {
      const meals = editingMeal === 'new'
        ? [...p.meals, { ...meal, _tmpId: meal._tmpId || Math.random().toString(36).slice(2) }]
        : p.meals.map((m) => (m._tmpId === meal._tmpId ? meal : m));
      return { ...p, meals };
    });
    setEditingMeal(null);
  }

  function pickFromLibrary(libraryMeal) {
    const meal = {
      _tmpId: Math.random().toString(36).slice(2),
      name: libraryMeal.name, mealType: libraryMeal.mealType, time: libraryMeal.time || '',
      ingredients: libraryMeal.ingredients || [],
      instructions: libraryMeal.instructions || '', videoUrl: libraryMeal.videoUrl || '',
      notes: libraryMeal.notes || '',
      macros: { calories: libraryMeal.macros?.calories||'', protein: libraryMeal.macros?.protein||'', carbs: libraryMeal.macros?.carbs||'', fat: libraryMeal.macros?.fat||'', fiber: libraryMeal.macros?.fiber||'' },
    };
    setPlan((p) => ({ ...p, meals: [...p.meals, meal] }));
    setShowLibrary(false);
    setAddMode(false);
  }

  function removeMeal(tmpId) { setPlan((p) => ({ ...p, meals: p.meals.filter((m) => m._tmpId !== tmpId) })); }
  function moveMeal(tmpId, dir) {
    setPlan((p) => {
      const meals = [...p.meals];
      const i = meals.findIndex((m) => m._tmpId === tmpId);
      const j = i + dir;
      if (j < 0 || j >= meals.length) return p;
      [meals[i], meals[j]] = [meals[j], meals[i]];
      return { ...p, meals };
    });
  }

  if (!loaded) return <div className="text-text-dim text-xs font-mono animate-pulse py-10 text-center">{t('loading')}</div>;

  // Library manager view
  if (showLibrary) {
    return (
      <MealLibraryPicker
        onPick={pickFromLibrary}
        onClose={() => setShowLibrary(false)}
      />
    );
  }

  // Meal form view
  if (editingMeal !== null) {
    return (
      <MealForm
        initial={editingMeal === 'new' ? emptyMeal() : editingMeal}
        onSave={saveMeal}
        onCancel={() => setEditingMeal(null)}
        t={t}
      />
    );
  }

  const totals = plan.meals.reduce(
    (acc, m) => ({ calories: acc.calories+(Number(m.macros?.calories)||0), protein: acc.protein+(Number(m.macros?.protein)||0), carbs: acc.carbs+(Number(m.macros?.carbs)||0), fat: acc.fat+(Number(m.macros?.fat)||0), fiber: acc.fiber+(Number(m.macros?.fiber)||0) }),
    { calories:0, protein:0, carbs:0, fat:0, fiber:0 }
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-mid">{traineeName?.split(' ')[0]}</p>

      <div>
        <label className="label">{t('planTitle')}</label>
        <input className="field" value={plan.title} onChange={(e) => setPlan((p) => ({ ...p, title: e.target.value }))} placeholder={t('planTitlePlaceholder')} />
      </div>
      <div>
        <label className="label">{t('overallNotes')}</label>
        <textarea rows={2} className="field resize-none !text-sm" value={plan.notes} onChange={(e) => setPlan((p) => ({ ...p, notes: e.target.value }))} placeholder={t('overallNotesPlaceholder')} />
      </div>

      {plan.meals.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-text-mid mb-3">{t('dailyTotalsLabel')}</div>
          <MacroBar macros={totals} />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label !mb-0">{t('mealsCount')(plan.meals.length)}</label>
          <button onClick={() => setShowLibrary(true)} className="text-xs font-semibold text-text-mid hover:text-text">{t('manageLibrary')}</button>
        </div>

        {/* Add-meal options */}
        {addMode ? (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setShowLibrary(true); setAddMode(false); }}
              className="flex-1 py-2.5 rounded-lg bg-surface-2 border border-accent/50 text-accent text-sm font-bold"
            >
              📚 {t('fromLibrary')}
            </button>
            <button
              onClick={() => { setEditingMeal('new'); setAddMode(false); }}
              className="flex-1 py-2.5 rounded-lg bg-surface-2 border border-border-strong text-sm font-bold text-text-mid"
            >
              ✏️ {t('fromScratch')}
            </button>
            <button onClick={() => setAddMode(false)} className="py-2.5 px-3 rounded-lg border border-border text-text-dim text-sm">✕</button>
          </div>
        ) : (
          <button onClick={() => setAddMode(true)} className="w-full mb-3 py-2.5 rounded-lg border border-dashed border-accent/50 text-accent text-sm font-bold hover:bg-accent/5">
            + {t('addMeal')}
          </button>
        )}

        {plan.meals.length === 0 ? (
          <div className="py-8 text-center text-text-dim text-xs italic border border-border rounded-xl">{t('noMealsYet')}</div>
        ) : (
          <div className="space-y-2">
            {plan.meals.map((m, i) => (
              <div key={m._tmpId} className="bg-surface border border-border rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">{m.name || 'Unnamed meal'}</span>
                      <span className="text-[9px] uppercase tracking-wide font-semibold text-text-mid bg-surface-2 border border-border px-1.5 py-0.5 rounded shrink-0">{m.mealType}</span>
                      {m.time && <span className="text-[10px] text-text-dim font-mono shrink-0">{m.time}</span>}
                    </div>
                    {(m.macros?.calories > 0 || m.macros?.protein > 0) && (
                      <div className="mt-1.5"><MacroBar macros={numericMacros(m.macros)} compact /></div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => moveMeal(m._tmpId,-1)} disabled={i===0} className="text-text-dim disabled:opacity-20 text-xs px-1">↑</button>
                    <button onClick={() => moveMeal(m._tmpId,1)} disabled={i===plan.meals.length-1} className="text-text-dim disabled:opacity-20 text-xs px-1">↓</button>
                  </div>
                </div>
                <div className="flex gap-2 mt-2.5">
                  <button onClick={() => setEditingMeal(m)} className="flex-1 py-1.5 rounded-lg bg-surface-2 border border-border-strong text-xs font-semibold">{t('edit')}</button>
                  <button onClick={() => removeMeal(m._tmpId)} className="py-1.5 px-3 rounded-lg border border-danger/50 text-danger text-xs font-semibold">{t('delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {err && <div className="text-xs text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">{err}</div>}
      <div className="flex items-center justify-between pt-1">
        {saved && <span className="text-xs text-accent">{t('savedMark')}</span>}
        <button onClick={save} disabled={saving} className="ml-auto bg-warm text-bg font-bold rounded-lg px-5 py-2.5 text-sm disabled:opacity-50">
          {saving ? t('saving') : t('savePlan')}
        </button>
      </div>
    </div>
  );
}

// ─── Meal form ────────────────────────────────────────────────────────
function MealForm({ initial, onSave, onCancel, t }) {
  const [meal, setMeal] = useState({ ...initial });

  function set(field, val) { setMeal((m) => ({ ...m, [field]: val })); }
  function setMacro(f, v) { setMeal((m) => ({ ...m, macros: { ...m.macros, [f]: v } })); }
  function setIng(i, f, v) { setMeal((m) => { const ing=[...m.ingredients]; ing[i]={...ing[i],[f]:v}; return {...m,ingredients:ing}; }); }
  function addIng() { setMeal((m) => ({ ...m, ingredients: [...m.ingredients, { name:'', amount:'' }] })); }
  function removeIng(i) { setMeal((m) => ({ ...m, ingredients: m.ingredients.filter((_,idx)=>idx!==i) })); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="text-text-mid hover:text-text text-sm">{t('back')}</button>
        <span className="font-bold text-sm">{initial.name || t('newMeal')}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="label">{t('mealName')}</label>
          <input className="field" placeholder={t('mealNamePlaceholder')} value={meal.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">{t('mealTypelabel')}</label>
          <select className="field !py-2.5 !text-sm" value={meal.mealType} onChange={(e) => set('mealType', e.target.value)}>
            {MEAL_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('suggestedTime')}</label>
          <input className="field !py-2.5 !text-sm" placeholder="7:30 AM" value={meal.time} onChange={(e) => set('time', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">{t('macrosLabel')}</label>
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          {[['calories','kcal'],['protein','P g'],['carbs','C g'],['fat','F g'],['fiber','Fi g']].map(([k,lbl]) => (
            <div key={k}>
              <label className="label !text-[9px]">{lbl}</label>
              <input type="number" min="0" className="field !py-1.5 !text-sm text-center" value={meal.macros[k]} onChange={(e) => setMacro(k, e.target.value)} placeholder="0" />
            </div>
          ))}
        </div>
        <MacroBar macros={{ calories:Number(meal.macros.calories)||0, protein:Number(meal.macros.protein)||0, carbs:Number(meal.macros.carbs)||0, fat:Number(meal.macros.fat)||0, fiber:Number(meal.macros.fiber)||0 }} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label !mb-0">{t('ingredientsLabel')}</label>
          <button onClick={addIng} className="text-xs font-bold text-accent">+ {t('add')}</button>
        </div>
        <div className="space-y-1.5">
          {meal.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <input className="field !py-1.5 !text-sm flex-1" placeholder={t('ingredientPlaceholder')} value={ing.name} onChange={(e) => setIng(i,'name',e.target.value)} />
              <input className="field !py-1.5 !text-sm w-24" placeholder={t('amountPlaceholder')} value={ing.amount} onChange={(e) => setIng(i,'amount',e.target.value)} />
              <button onClick={() => removeIng(i)} className="text-danger px-1">✕</button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="label">{t('instructions')}</label>
        <textarea rows={4} className="field resize-none !text-sm" placeholder={t('instructionsPlaceholder')} value={meal.instructions} onChange={(e) => set('instructions', e.target.value)} />
      </div>
      <div>
        <label className="label">{t('videoLabel')}</label>
        <input className="field !text-sm" placeholder={t('videoPlaceholder')} value={meal.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
      </div>
      <div>
        <label className="label">{t('notesLabel')}</label>
        <textarea rows={2} className="field resize-none !text-sm" placeholder={t('notesPlaceholder')} value={meal.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-3 border border-border-strong rounded-lg text-sm font-semibold text-text-mid">{t('cancel')}</button>
        <button onClick={() => onSave(meal)} disabled={!meal.name.trim()} className="flex-1 btn-accent !py-3 disabled:opacity-40">{t('save')}</button>
      </div>
    </div>
  );
}
