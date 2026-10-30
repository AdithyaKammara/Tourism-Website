import { ArrowRight, Camera } from 'lucide-react';
import { formatBudget, formatSeason, VIBE_LABELS, type DestinationCard } from '../../lib/destinations';

export default function Card({ d, eager = false }: { d: DestinationCard; eager?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-card shadow-[0_4px_24px_rgb(3_31_35/0.04)] ring-1 ring-line/60 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(3_31_35/0.1)]">
      {/* The view-transition name lets this photo morph into the hero on the destination page. */}
      <div className="relative h-64 overflow-hidden bg-paper-deep" style={{ viewTransitionName: `dest-${d.id}` }}>
        <img
          src={d.image.src}
          srcSet={d.image.srcset}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          width={d.image.width}
          height={d.image.height}
          alt={d.image.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover transition-transform duration-700 ease-out-quint group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-forest/60 via-transparent to-transparent" />
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-accent" /> {VIBE_LABELS[d.vibes[0]]}
        </span>
        <span className="absolute bottom-3 left-4 inline-flex max-w-[85%] items-center gap-1 truncate rounded-full bg-forest/70 px-2.5 py-0.5 text-[11px] text-cream backdrop-blur-md">
          <Camera className="size-3 shrink-0" aria-hidden="true" /> {d.credit.author}, {d.credit.license}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="p-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-bold tracking-wider text-ink-soft uppercase">{d.state}</span>
            <span className="shrink-0 rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-semibold text-moss">
              Best: {formatSeason(d.bestMonths)}
            </span>
          </div>
          <h2 className="font-display text-2xl">
            {/* The link covers the whole card via the ::after overlay. */}
            <a href={`/destinations/${d.id}`} className="after:absolute after:inset-0 group-hover:text-accent">
              {d.name}
            </a>
          </h2>
          <p className="mt-2 line-clamp-2 text-ink-soft">{d.tagline}</p>
        </div>
        <div className="flex items-center justify-between gap-3 bg-paper-deep/60 px-6 py-4">
          <div>
            <span className="block text-xs font-semibold text-ink-soft">Real daily spending</span>
            <span className="text-sm font-bold">
              {formatBudget(d.budgetPerDay)} <span className="font-normal text-ink-soft">/day</span>
            </span>
          </div>
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-sm transition-colors group-hover:bg-moss"
          >
            Explore <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
