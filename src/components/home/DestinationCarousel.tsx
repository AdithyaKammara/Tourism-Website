import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatSeason, type DestinationCard } from '../../lib/destinations';

/** A horizontally scrolling row of destinations with smooth, snap-aligned prev/next controls. */
export default function DestinationCarousel({ destinations }: { destinations: DestinationCard[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 4);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  function slide(direction: 1 | -1) {
    const el = track.current;
    const card = el?.querySelector('li');
    if (!el || !card) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * (card.getBoundingClientRect().width + 20), behavior: reduce ? 'auto' : 'smooth' });
  }

  return (
    <div>
      <div className="mb-6 flex justify-end gap-2">
        <button type="button" onClick={() => slide(-1)} disabled={atStart} aria-label="Previous destinations" className="grid size-11 place-items-center rounded-full border border-ink/20 transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-35">
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => slide(1)} disabled={atEnd} aria-label="Next destinations" className="grid size-11 place-items-center rounded-full border border-ink/20 transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-35">
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <ul
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:-mx-12 lg:scroll-px-12 lg:px-12 [&::-webkit-scrollbar]:hidden"
        aria-label="Popular destinations"
      >
        {destinations.map((d) => (
          <li key={d.id} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[30%] xl:w-[23%]">
            <a href={`/destinations/${d.id}`} className="group relative block overflow-hidden rounded-3xl">
              <img
                src={d.image.src}
                srcSet={d.image.srcset}
                sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 78vw"
                alt={d.image.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] w-full object-cover transition-transform duration-400 ease-out-quint group-hover:scale-[1.06]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-forest/90 via-forest/40 to-transparent p-5 pt-20 text-cream">
                <p className="text-xs text-cream/75">{d.state}</p>
                <p className="font-display text-2xl">{d.name}</p>
                <p className="mt-1 text-xs text-cream/80">Best {formatSeason(d.bestMonths)}</p>
                {/* Slides up on hover; always visible on touch screens, which have no hover. */}
                <span className="mt-3 inline-flex translate-y-2 items-center gap-1.5 text-sm font-semibold text-sage-light opacity-0 transition duration-300 ease-out-quint group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
                  Read the guide <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
