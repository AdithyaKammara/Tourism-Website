import { formatBudget, formatSeason, type DestinationCard } from '../../lib/destinations';

export default function Card({ d, eager = false }: { d: DestinationCard; eager?: boolean }) {
  return (
    <article className="group relative">
      <div className="aspect-[4/3] overflow-hidden bg-paper-deep">
        <img
          src={d.image.src}
          srcSet={d.image.srcset}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          width={d.image.width}
          height={d.image.height}
          alt={d.image.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover transition-transform duration-700 ease-out-quint group-hover:scale-[1.03]"
        />
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
