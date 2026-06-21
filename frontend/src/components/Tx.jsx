import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCached, translateText } from '../lib/translator';

/**
 * <Tx> — Transparently translates its text child to Arabic when the app
 * language is set to Arabic. Uses an in-memory + localStorage cache so
 * each unique string is only ever sent to the API once per device.
 *
 * Usage:
 *   <Tx>{meal.name}</Tx>
 *   <Tx>{exercise.formNotes}</Tx>
 */
export default function Tx({ children }) {
  const { lang } = useLanguage();
  const text = String(children ?? '');

  // Initialise synchronously from cache (no flash for already-translated strings).
  const [out, setOut] = useState(() => {
    if (lang !== 'ar' || !text.trim()) return text;
    return getCached(text) ?? text;
  });

  useEffect(() => {
    if (lang !== 'ar' || !text.trim()) {
      setOut(text);
      return;
    }
    const cached = getCached(text);
    if (cached) { setOut(cached); return; }

    let alive = true;
    translateText(text).then((result) => { if (alive) setOut(result); });
    return () => { alive = false; };
  }, [lang, text]);

  // Return as fragment so Tx can be used anywhere a string child is expected.
  return <>{out}</>;
}
