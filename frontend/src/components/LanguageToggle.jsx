import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();
  return (
    <button
      onClick={toggleLang}
      aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      className="h-8 px-2.5 rounded-full flex items-center justify-center bg-surface-2 border border-border hover:border-border-strong transition-colors font-mono text-[11px] font-bold text-text-mid tracking-wide"
    >
      {lang === 'en' ? 'عر' : 'EN'}
    </button>
  );
}
