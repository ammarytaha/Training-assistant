// Translation engine with two modes:
//
// 1. preTranslate(strings[]) — called at data-fetch time (during loading spinner).
//    Sends all strings in ONE batch to the API. By the time content renders,
//    every string is already in cache → <Tx> renders instantly with no flash.
//
// 2. translateText(string) — lazy per-component fallback (DataLoader batch, 30ms window).
//    Used by <Tx> for strings that weren't pre-translated.
//
// Cache: in-memory Map (fast) + localStorage (persistent across sessions).
// Each unique string is ever only sent to the API ONCE per device.

const STORAGE_KEY = 'tx_ar_v2';

const cache = new Map(
  Object.entries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
);

function persistCache() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(cache)));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function callApi(texts) {
  if (!texts.length) return;
  const res = await fetch('/api/translate', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, to: 'ar' }),
  });
  const data = await res.json();
  texts.forEach((text, i) => {
    const tr = data.translations?.[i] ?? text;
    cache.set(text, tr);
  });
  persistCache();
}

// ── 1. Eager batch (called during data fetch, before render) ─────────
export async function preTranslate(strings) {
  const missing = [...new Set(strings.filter((s) => s?.trim() && !cache.has(s)))];
  if (!missing.length) return;
  // Split into chunks of 60 to stay under token limits
  for (let i = 0; i < missing.length; i += 60) {
    await callApi(missing.slice(i, i + 60));
  }
}

// ── 2. Lazy per-string (DataLoader pattern, 30ms window) ─────────────
let pending = new Map();
let batchTimer = null;

async function flushBatch() {
  const batch = [...pending.entries()];
  pending = new Map();
  batchTimer = null;
  const texts = batch.map(([t]) => t);
  try {
    await callApi(texts);
    batch.forEach(([text, resolvers]) => resolvers.forEach((r) => r(cache.get(text) ?? text)));
  } catch {
    batch.forEach(([text, resolvers]) => resolvers.forEach((r) => r(text)));
  }
}

export function getCached(text) {
  return cache.get(text) ?? null;
}

export function translateText(text) {
  const str = String(text ?? '');
  if (!str.trim()) return Promise.resolve(str);
  if (cache.has(str)) return Promise.resolve(cache.get(str));
  return new Promise((resolve) => {
    if (!pending.has(str)) pending.set(str, []);
    pending.get(str).push(resolve);
    if (!batchTimer) batchTimer = setTimeout(flushBatch, 30);
  });
}
