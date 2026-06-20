import { useLanguage } from '../contexts/LanguageContext';

export default function MacroBar({ macros = {}, compact = false }) {
  const { t } = useLanguage();
  const { calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0 } = macros;
  const total = protein * 4 + carbs * 4 + fat * 9;

  const segments = [
    { key: 'protein', label: t('protein'), grams: protein, kcal: protein * 4, color: 'bg-accent' },
    { key: 'carbs',   label: t('carbs'),   grams: carbs,   kcal: carbs * 4,   color: 'bg-blue-400' },
    { key: 'fat',     label: t('fat'),     grams: fat,     kcal: fat * 9,     color: 'bg-warm' },
  ];

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex rounded-full overflow-hidden h-2 macro-bar">
          {total > 0 ? segments.map((s) => (
            <div key={s.key} className={`${s.color} h-full transition-all`} style={{ width: `${(s.kcal / total) * 100}%` }} />
          )) : <div className="bg-border w-full h-full rounded-full" />}
        </div>
        <div className="flex gap-3 text-[10px] font-mono text-text-mid">
          {calories > 0 && <span className="text-text font-semibold">{calories} kcal</span>}
          {segments.map((s) => s.grams > 0 && <span key={s.key}>{s.grams}g {s.label.toLowerCase()}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg overflow-hidden h-4 macro-bar">
        {total > 0 ? segments.map((s) => (
          <div key={s.key} className={`${s.color} h-full`} style={{ width: `${(s.kcal / total) * 100}%` }} title={`${s.label}: ${s.grams}g`} />
        )) : <div className="bg-border-strong w-full h-full" />}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <MacroCell label={t('calories')} value={calories || '—'} unit={calories ? 'kcal' : ''} highlight />
        {segments.map((s) => (
          <MacroCell key={s.key} label={s.label} value={s.grams || '—'} unit={s.grams ? 'g' : ''} dot={s.color} />
        ))}
      </div>
      {fiber > 0 && <div className="text-[10px] text-text-dim font-mono">{t('fiber')}: {fiber}g</div>}
    </div>
  );
}

function MacroCell({ label, value, unit, highlight, dot }) {
  return (
    <div className="bg-surface-2 rounded-lg p-2 text-center">
      {dot && <div className={`w-2 h-2 rounded-full ${dot} mx-auto mb-1`} />}
      <div className={`font-mono font-bold text-base ${highlight ? 'text-accent' : 'text-text'}`}>
        {value}{unit && <span className="text-[10px] font-normal text-text-dim ml-0.5">{unit}</span>}
      </div>
      <div className="text-[9px] uppercase tracking-wide text-text-dim mt-0.5">{label}</div>
    </div>
  );
}
