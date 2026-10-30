import { ArrowRight } from 'lucide-react';
import { formatBudget, formatSeason, type DestinationCard } from '../../lib/destinations';

export default function Card({ d, eager = false }: { d: DestinationCard; eager?: boolean }) {
  return (
    <article className="group relative">
      {/* The view-transition name lets this photo morph into the hero on the destination page. */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-deep" style={{ viewTransitionName: `dest-${d.id}` }}>
        <img
          src={d.image.src}
          srcSet={d.image.srcset}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          width={d.image.width}
          height={d.image.height}
          alt={d.image.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover transition-transform duration-400 ease-out-quint group-hover:scale-[1.05]"
        />
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold text-ink opacity-0 shadow-soft transition duration-300 ease-out-quint group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        >
          Read the guide <ArrowRight className="size-3.5" />
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl">
          {/* The link covers the whole card via the ::after overlay. */}
          <a href={`/destinations/${d.id}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {d.name}
          </a>
        </h3>
        <span className="eyebrow shrink-0">{d.state}</span>
      </div>
      <p className="mt-2 text-ink-soft">{d.tagline}</p>
      <dl className="mt-4 flex gap-6 border-t border-line pt-3 text-sm">
        <div>
          <dt className="sr-only">Best time</dt>
          <dd>{formatSeason(d.bestMonths)}</dd>
        </div>
        <div>
          <dt className="sr-only">Daily budget</dt>
          <dd>{formatBudget(d.budgetPerDay)}/day</dd>
        </div>
      </dl>
    </article>
  );
}
