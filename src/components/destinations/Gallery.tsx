import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

export type GalleryPhoto = {
  thumb: string;
  thumbSrcset: string;
  full: string;
  alt: string;
  credit: { author: string; license: string; source: string };
};

/** Photo grid that opens a full-screen lightbox with keyboard and swipe navigation. */
export default function Gallery({ photos, place }: { photos: GalleryPhoto[]; place: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);

  const show = (i: number) => setOpen((i + photos.length) % photos.length);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) dialog.close();
  }, [open]);

  const photo = open !== null ? photos[open] : null;

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.full} className={i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block size-full overflow-hidden rounded-2xl"
              aria-label={`Open photo ${i + 1} of ${photos.length}: ${p.alt}`}
            >
              <img
                src={p.thumb}
                srcSet={p.thumbSrcset}
                sizes={i === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] size-full object-cover transition-transform duration-700 ease-out-quint group-hover:scale-[1.04]"
              />
              <span className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-cream/90 text-forest opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand className="size-4" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={`${place} photos`}
        onClose={() => setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') show((open ?? 0) + 1);
          if (e.key === 'ArrowLeft') show((open ?? 0) - 1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) show((open ?? 0) + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-forest/95 p-0 text-cream backdrop:bg-black/60"
      >
        {photo && open !== null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 text-sm md:px-6">
              <span aria-live="polite">
                {open + 1} / {photos.length}
              </span>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close photos" className="grid size-10 place-items-center rounded-full hover:bg-cream/10">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <figure className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 pb-6 md:px-20">
              <img src={photo.full} alt={photo.alt} className="min-h-0 max-w-full flex-1 rounded-xl object-contain" />
              <figcaption className="text-center text-sm text-cream/80">
                {photo.alt}
                <span className="block text-xs text-cream/60">
                  Photo:{' '}
                  <a href={photo.credit.source} className="underline underline-offset-2" target="_blank" rel="noopener">
                    {photo.credit.author}
                  </a>
                  , {photo.credit.license}
                </span>
              </figcaption>
            </figure>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => show(open - 1)} aria-label="Previous photo" className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 hover:bg-cream/20">
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => show(open + 1)} aria-label="Next photo" className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 hover:bg-cream/20">
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
