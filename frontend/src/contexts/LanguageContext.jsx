import { createContext, useContext, useEffect, useState } from 'react';
import en from '../i18n/en';
import ar from '../i18n/ar';

const translations = { en, ar };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang]);

  // Returns the translation for `key`. If the value is a function, it is
  // returned as-is so callers can invoke it with arguments: t('key')(arg).
  function t(key) {
    const dict = translations[lang] || en;
    const val = dict[key] ?? en[key];
    return val !== undefined ? val : key;
  }

  function toggle() {
    setLang((l) => (l === 'en' ? 'ar' : 'en'));
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang: toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
