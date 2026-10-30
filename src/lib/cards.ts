import { getImage } from 'astro:assets';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { DestinationCard } from './destinations';

export async function getDestinations() {
  const all = await getCollection('destinations');
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Pre-optimises the hero image so React islands get ready-to-use URLs. */
export async function toCard(entry: CollectionEntry<'destinations'>): Promise<DestinationCard> {
  const d = entry.data;
  const img = await getImage({ src: d.hero, widths: [480, 800, 1200], width: 800, format: 'webp' });
  return {
    id: entry.id,
    name: d.name,
    state: d.state,
    tagline: d.tagline,
    vibes: d.vibes,
    bestMonths: d.bestMonths,
    budgetPerDay: d.budgetPerDay,
    daysNeeded: d.daysNeeded,
    image: {
      src: img.src,
      srcset: img.srcSet.attribute,
      width: Number(img.attributes.width ?? 800),
      height: Number(img.attributes.height ?? 530),
      alt: d.heroAlt,
    },
  };
}
