// Local-date helpers (avoid UTC off-by-one from toISOString()).
export function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().split('T')[0];
}

export function isoFor(date) {
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date - tz).toISOString().split('T')[0];
}

export function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}
