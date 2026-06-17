import { useEffect, useState } from 'react';
import { api } from '../api';

// Skill-tree view: each progression is a vertical path of steps. The trainee
// taps a step to mark it as their current target (steps before it count as done).
export default function SkillTree() {
  const [skills, setSkills] = useState([]);
  const [open, setOpen] = useState(null); // expanded skill id
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/profile/skills');
        setSkills(data.skills || []);
      } catch {
        /* empty */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function setStep(skillId, stepIndex) {
    // Tapping the current step again advances past it (mark complete).
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, currentStep: stepIndex } : s))
    );
    try {
      await api.put(`/api/profile/skills/${skillId}`, { currentStep: stepIndex });
    } catch {
      /* optimistic; ignore */
    }
  }

  if (!loaded) {
    return <div className="text-text-dim text-xs font-mono animate-pulse py-8 text-center">loading skills…</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-text-mid text-sm mb-1">
        Pick a goal and work down the path. Tap the step you're on — everything above it counts as done. Your
        AI coach uses this to plan what's next.
      </p>
      {skills.map((skill) => {
        const total = skill.steps.length;
        const done = Math.min(skill.currentStep, total);
        const mastered = done >= total;
        const isOpen = open === skill.id;
        return (
          <div key={skill.id} className="bg-surface border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : skill.id)}
              className="w-full text-left p-4 flex items-center gap-3"
            >
              <span className="text-2xl">{skill.icon}</span>
              <div className="flex-1">
                <div className="font-extrabold leading-tight">{skill.name}</div>
                <div className="text-xs text-text-mid mt-0.5">{skill.blurb}</div>
                {/* progress bar */}
                <div className="mt-2 h-1.5 bg-surface-2 rounded overflow-hidden">
                  <div
                    className={`h-full ${mastered ? 'bg-accent' : 'bg-accent-dim'}`}
                    style={{ width: `${(done / total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-mono text-sm font-bold ${mastered ? 'text-accent' : 'text-text'}`}>
                  {done}/{total}
                </div>
                <div className="text-[10px] text-text-dim uppercase tracking-wide">{mastered ? 'done' : skill.group}</div>
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-1.5">
                {skill.steps.map((step, i) => {
                  const isDone = i < done;
                  const isCurrent = i === done && !mastered;
                  return (
                    <button
                      key={i}
                      onClick={() => setStep(skill.id, isCurrent ? i + 1 : i)}
                      className={`w-full text-left flex items-start gap-3 rounded-lg px-3 py-2.5 border transition-colors ${
                        isCurrent
                          ? 'border-accent bg-accent/5'
                          : isDone
                          ? 'border-border bg-surface-2/40'
                          : 'border-border hover:border-border-strong'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-5 h-5 shrink-0 rounded-full grid place-items-center text-[11px] font-bold ${
                          isDone
                            ? 'bg-accent text-bg'
                            : isCurrent
                            ? 'border-2 border-accent text-accent'
                            : 'border border-border-strong text-text-dim'
                        }`}
                      >
                        {isDone ? '✓' : i + 1}
                      </span>
                      <div>
                        <div className={`text-sm font-semibold ${isDone ? 'text-text-mid line-through' : 'text-text'}`}>
                          {step.name}
                        </div>
                        <div className="text-xs text-text-mid">{step.detail}</div>
                        {isCurrent && (
                          <div className="text-[10px] text-accent uppercase tracking-widest mt-1">
                            Current goal · tap to mark done
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
