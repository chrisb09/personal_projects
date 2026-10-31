import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const { t } = useTranslation('common');
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src && failedSrc === src);

  useEffect(() => {
    if (!src) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={t('chat.view_image', 'View image')}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-hidden focus:ring-2 focus:ring-white/60"
        aria-label={t('chat.close_image', 'Close image')}
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="flex max-h-[88vh] max-w-[92vw] items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        {failed ? (
          <div className="max-w-md rounded-xl border border-white/15 bg-white/10 px-6 py-5 text-center text-sm text-white/80">
            {t('chat.image_failed', 'This image could not be loaded.')}
            {alt && <p className="mt-1 text-xs text-white/60">{alt}</p>}
          </div>
        ) : (
          <img
            src={src}
            alt={alt || t('chat.view_image', 'View image')}
            className="max-h-[88vh] max-w-full rounded-lg object-contain shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            referrerPolicy="no-referrer"
            onLoad={() => setFailedSrc(null)}
            onError={() => setFailedSrc(src)}
          />
        )}
      </div>
    </div>
  );
}
