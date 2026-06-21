import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { preTranslate } from '../lib/translator';
import Tx from './Tx';

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function ExerciseModal({ exercise, onClose }) {
  const { t, lang } = useLanguage();
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (lang === 'ar' && exercise) {
      preTranslate([exercise.name, exercise.info].filter(Boolean));
    }
  }, [lang, exercise]);

  if (!exercise) return null;

  const videoId = youtubeId(exercise.videoUrl);
  const photos = exercise.photos || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/70 backdrop-blur" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">{t('formNotes')}</div>
        <h2 className="text-2xl font-extrabold tracking-tight mb-1"><Tx>{exercise.name}</Tx></h2>
        <div className="font-mono text-xs text-text-mid mb-4">
          {exercise.reps}{exercise.sets ? ` · ${exercise.sets} ${t('sets').toUpperCase()}` : ''}
        </div>

        {videoId && (
          <div className="mb-4 rounded-xl overflow-hidden border border-border" style={{ aspectRatio: '16/9' }}>
            <iframe
              width="100%" height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={exercise.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen className="block"
            />
          </div>
        )}

        {photos.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">
              {t('stepPhotos')} ({photoIndex + 1}/{photos.length})
            </div>
            <div className="relative rounded-xl overflow-hidden border border-border bg-surface-2 mb-2" style={{ aspectRatio: '4/3' }}>
              <img src={photos[photoIndex]} alt={`Step ${photoIndex + 1}`} className="w-full h-full object-contain" />
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))} disabled={photoIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30">‹</button>
                  <button onClick={() => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))} disabled={photoIndex === photos.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30">›</button>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIndex ? 'bg-accent' : 'bg-border-strong'}`} />
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">
          <Tx>{exercise.info || t('noFormNotes')}</Tx>
        </p>

        <button onClick={onClose} className="w-full mt-5 py-3 bg-transparent border border-border-strong rounded-lg text-sm font-semibold uppercase tracking-wider hover:border-text">
          {t('close')}
        </button>
      </div>
    </div>
  );
}
