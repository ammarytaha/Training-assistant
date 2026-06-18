// Build a per-exercise history from a trainee's logged sessions.
//
// Each session stores `perExercise` keyed by exercise key. For actual-reps
// logging the client writes { name, prescribed, reps: [n, n, ...] } per
// exercise. We group those across sessions by exercise name and compute a PR
// (best single set) so the trainee/coach can see progression over time.
function buildExerciseHistory(sessions) {
  const map = new Map(); // nameKey -> { name, entries: [] }

  for (const s of sessions) {
    const pe = s.perExercise || {};
    for (const key of Object.keys(pe)) {
      const e = pe[key];
      if (!e || typeof e !== 'object' || !Array.isArray(e.reps)) continue;

      const name = (e.name || '').toString().trim();
      if (!name) continue;

      const reps = e.reps.map(Number).filter((n) => Number.isFinite(n) && n > 0);
      if (reps.length === 0) continue;

      const nameKey = name.toLowerCase();
      if (!map.has(nameKey)) map.set(nameKey, { name, entries: [] });

      map.get(nameKey).entries.push({
        date: s.date,
        reps,
        sets: reps.length,
        bestRep: Math.max(...reps),
        totalReps: reps.reduce((a, b) => a + b, 0),
        prescribed: (e.prescribed || '').toString(),
      });
    }
  }

  const out = [];
  for (const { name, entries } of map.values()) {
    entries.sort((a, b) => a.date.localeCompare(b.date));
    out.push({
      name,
      entries,
      pr: Math.max(...entries.map((e) => e.bestRep)),
      sessions: entries.length,
      lastDate: entries[entries.length - 1].date,
    });
  }
  out.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  return out;
}

module.exports = { buildExerciseHistory };
