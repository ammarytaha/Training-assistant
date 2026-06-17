// Form-notes modal. Shows coaching cues and, if the coach added one, a
// "Watch video" link that opens YouTube in a NEW TAB (never embedded/downloaded).
export default function ExerciseModal({ exercise, onClose }) {
  if (!exercise) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/70 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-strong rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">Form Notes</div>
        <h2 className="text-2xl font-extrabold tracking-tight mb-1">{exercise.name}</h2>
        <div className="font-mono text-xs text-text-mid mb-4">
          {exercise.reps}
          {exercise.sets ? ` · ${exercise.sets} SETS` : ''}
        </div>

        <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">
          {exercise.info || 'No form notes yet for this exercise.'}
        </p>

        {exercise.videoUrl && (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 bg-warm/15 border border-warm/40 text-warm rounded-lg py-3 font-semibold"
          >
            ▶ Watch coaching video
          </a>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-transparent border border-border-strong rounded-lg text-sm font-semibold uppercase tracking-wider hover:border-text"
        >
          Close
        </button>
      </div>
    </div>
  );
}
