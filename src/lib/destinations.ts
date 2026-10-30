// Shared, framework-free helpers. Safe to import from React islands.

export type Vibe = 'hills' | 'water' | 'heritage' | 'desert' | 'mountains' | 'culture';

export const VIBE_LABELS: Record<Vibe, string> = {
  hills: 'Cool hills',
  water: 'On the water',
  heritage: 'Old stones',
  desert: 'Desert',
  mountains: 'High mountains',
  culture: 'Living culture',
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Slim, serialisable destination data passed to React islands. */
export type DestinationCard = {
  id: string;
  name: string;
  state: string;
  tagline: string;
  vibes: Vibe[];
  bestMonths: number[];
  budgetPerDay: { low: number; high: number };
  daysNeeded: { min: number; max: number };
  coordinates: { lat: number; lng: number };
  image: { src: string; srcset: string; width: number; height: number; alt: string };
  credit: { author: string; license: string; source: string };
};

/** Daily budget bands, matched against the low end of a place's per-day cost. */
export const BUDGETS = {
  easy: { label: 'From ₹2,000 or less', test: (low: number) => low <= 2000 },
  comfy: { label: 'From over ₹2,000', test: (low: number) => low > 2000 },
} as const;
export type Budget = keyof typeof BUDGETS;

export function matches(d: DestinationCard, month: number | null, vibe: Vibe | null, query = '', budget: Budget | null = null) {
  return (
    (month === null || d.bestMonths.includes(month)) &&
    (budget === null || BUDGETS[budget].test(d.budgetPerDay.low)) &&
    (vibe === null || d.vibes.includes(vibe)) &&
    matchesQuery(d, query)
  );
}

/** Every word of the query must appear in the name, state, tagline or mood (so "kerala hills" finds Munnar). */
export function matchesQuery(d: DestinationCard, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [d.name, d.state, d.tagline, ...d.vibes, ...d.vibes.map((v) => VIBE_LABELS[v])].join(' ').toLowerCase();
  return words.every((w) => haystack.includes(w) || haystack.includes(w.replace(/s$/, '')));
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatBudget({ low, high }: { low: number; high: number }) {
  return `${inr.format(low)}–${inr.format(high).replace('₹', '')}`;
}

export function formatDays({ min, max }: { min: number; max: number }) {
  return min === max ? `${min} days` : `${min}–${max} days`;
}

/** Turns [11, 12, 1, 2] into "Nov–Feb"; non-contiguous months become "Mar–May, Sep–Oct". */
export function formatSeason(months: number[]) {
  const set = new Set(months);
  const runs: [number, number][] = [];
  // Start from a month that isn't preceded by an in-season month, so runs can wrap over the new year.
  const start = [...set].find((m) => !set.has(m === 1 ? 12 : m - 1));
  if (start === undefined) return 'All year';
  let m = start;
  for (let i = 0; i < 12; i++, m = (m % 12) + 1) {
    if (!set.has(m)) continue;
    const prev = m === 1 ? 12 : m - 1;
    if (runs.length && set.has(prev) && runs[runs.length - 1][1] === prev) runs[runs.length - 1][1] = m;
    else runs.push([m, m]);
  }
  return runs.map(([a, b]) => (a === b ? MONTHS[a - 1] : `${MONTHS[a - 1]}–${MONTHS[b - 1]}`)).join(', ');
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
