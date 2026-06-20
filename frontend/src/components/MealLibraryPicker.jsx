import { useEffect, useState } from 'react';
import { api } from '../api';
import { useLanguage } from '../contexts/LanguageContext';
import MacroBar from './MacroBar';

// Modal that lets the coach pick meals from their library and add them to a plan.
// Also lets them manage (add/edit/delete) the library itself.
export default function MealLibraryPicker({ onPick, onClose }) {
  const { t } = useLanguage();
  const [meals, setMeals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | meal object

  async function load() {
    try {
      const data = await api.get('/api/coach/meal-library');
      setMeals(data.meals);
    } catch { /* ignore */ }
    setLoaded(true);
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    await api.del(`/api/coach/meal-library/${id}`);
    setMeals((m) => m.filter((x) => x._id !== id));
  }

  async function saveToLibrary(meal) {
    if (meal._id) {
      const data = await api.put(`/api/coach/meal-library/${meal._id}`, meal);
      setMeals((m) => m.map((x) => (x._id === meal._id ? data.meal : x)));
    } else {
      const data = await api.post('/api/coach/meal-library', meal);
      setMeals((m) => [data.meal, ...m]);
    }
    setEditing(null);
  }

  if (editing !== null) {
    return (
      <LibraryMealForm
        initial={editing === 'new' ? emptyMeal() : editing}
        onSave={saveToLibrary}
        onCancel={() => setEditing(null)}
        t={t}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-lg">{t('mealLibrary')}</h3>
        <div className="flex gap-2">
          <button onClick={() => setEditing('new')} className="text-xs font-bold text-accent">+ {t('new')}</button>
          <button onClick={onClose} className="text-xs text-text-dim hover:text-text">{t('close')} ✕</button>
        </div>
      </div>

      {!loaded ? (
        <div className="text-text-dim text-xs font-mono animate-pulse py-8 text-center">{t('loading')}</div>
      ) : meals.length === 0 ? (
        <div className="py-8 text-center text-text-dim text-xs italic border border-border rounded-xl px-4">{t('noLibraryMeals')}</div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {meals.map((m) => (
            <div key={m._id} className="bg-surface border border-border rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{m.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-text-mid">{m.mealType}{m.time ? ` · ${m.time}` : ''}</div>
                  {(m.macros?.calories || m.macros?.protein) && (
                    <div className="mt-1.5"><MacroBar macros={m.macros} compact /></div>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onPick(m)}
                  className="flex-1 py-1.5 rounded-lg bg-accent text-bg text-xs font-bold"
                >
                  {t('addToPlan')}
                </button>
                <button onClick={() => setEditing(m)} className="py-1.5 px-3 rounded-lg bg-surface-2 border border-border-strong text-xs font-semibold">{t('edit')}</button>
                <button onClick={() => remove(m._id)} className="py-1.5 px-3 rounded-lg border border-danger/50 text-danger text-xs font-semibold">{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Library meal form ────────────────────────────────────────────────
const MEAL_TYPES = ['breakfast','lunch','dinner','snack','pre-workout','post-workout','meal'];

function emptyMeal() {
  return { name:'', mealType:'meal', time:'', ingredients:[{name:'',amount:''}], instructions:'', videoUrl:'', notes:'', macros:{calories:'',protein:'',carbs:'',fat:'',fiber:''} };
}

function LibraryMealForm({ initial, onSave, onCancel, t }) {
  const [meal, setMeal] = useState({ ...initial });
  const [saving, setSaving] = useState(false);

  function set(field, val) { setMeal((m) => ({ ...m, [field]: val })); }
  function setMacro(field, val) { setMeal((m) => ({ ...m, macros: { ...m.macros, [field]: val } })); }
  function setIng(i, field, val) {
    setMeal((m) => {
      const ingredients = [...m.ingredients];
      ingredients[i] = { ...ingredients[i], [field]: val };
      return { ...m, ingredients };
    });
  }
  function addIng() { setMeal((m) => ({ ...m, ingredients: [...m.ingredients, {name:'',amount:''}] })); }
  function removeIng(i) { setMeal((m) => ({ ...m, ingredients: m.ingredients.filter((_,idx) => idx!==i) })); }

  async function submit() {
    if (!meal.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...meal, macros: { calories:Number(meal.macros.calories)||0, protein:Number(meal.macros.protein)||0, carbs:Number(meal.macros.carbs)||0, fat:Number(meal.macros.fat)||0, fiber:Number(meal.macros.fiber)||0 } });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="text-text-mid hover:text-text text-sm">{t('back')}</button>
        <span className="font-bold text-sm">{meal._id ? t('edit') : t('newMeal')}</span>
      </div>
      <div>
        <label className="label">{t('mealName')}</label>
        <input className="field" placeholder={t('mealNamePlaceholder')} value={meal.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
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
        <div className="grid grid-cols-5 gap-1.5">
          {[['calories','kcal'],['protein','P g'],['carbs','C g'],['fat','F g'],['fiber','Fi g']].map(([k,lbl]) => (
            <div key={k}>
              <label className="label !text-[9px]">{lbl}</label>
              <input type="number" min="0" className="field !py-1.5 !text-sm text-center" value={meal.macros[k]} onChange={(e) => setMacro(k, e.target.value)} placeholder="0" />
            </div>
          ))}
        </div>
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
        <textarea rows={3} className="field resize-none !text-sm" placeholder={t('instructionsPlaceholder')} value={meal.instructions} onChange={(e) => set('instructions', e.target.value)} />
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
        <button onClick={submit} disabled={saving || !meal.name.trim()} className="flex-1 btn-accent !py-3 disabled:opacity-40">{saving ? t('saving') : t('save')}</button>
      </div>
    </div>
  );
}
