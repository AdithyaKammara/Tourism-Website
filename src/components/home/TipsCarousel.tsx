import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export type Tip = { id: string; place: string; state: string; text: string; thumb: string };

/** One "good to know" tip at a time, taken from the destination guides. */
export default function TipsCarousel({ tips }: { tips: Tip[] }) {
  const [index, setIndex] = useState(0);
  const tip = tips[index];
  const go = (step: number) => setIndex((i) => (i + step + tips.length) % tips.length);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <figure
        className="flex-1 rounded-3xl bg-card p-6 shadow-soft md:p-8"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${tips.length}`}
      >
        <div className="flex gap-5">
          <img src={tip.thumb} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover" />
          <div>
            <Quote className="size-6 text-accent/50" aria-hidden="true" />
            <blockquote className="mt-2 font-display text-lg leading-snug italic md:text-xl" aria-live="polite">
              {tip.text}
            </blockquote>
          </div>
        </div>
        <figcaption className="mt-6 flex items-end justify-between gap-4 pl-[4.75rem] text-sm">
          <span>
            <a href={`/destinations/${tip.id}`} className="font-medium hover:text-accent">
              {tip.place}
            </a>
            <span className="block text-xs text-ink-soft">{tip.state}</span>
          </span>
          <span className="text-xs text-ink-soft">From our guide</span>
        </figcaption>
      </figure>

      <div className="flex gap-2 self-end sm:self-center">
        <button type="button" onClick={() => go(-1)} aria-label="Previous tip" className="grid size-10 place-items-center rounded-full border border-ink/20 transition-colors hover:border-ink">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next tip" className="grid size-10 place-items-center rounded-full border border-ink/20 transition-colors hover:border-ink">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
