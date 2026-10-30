import type { Vibe } from '../destinations';
import { uid, type PackingItem } from './types';

const BASE: [string, string][] = [
  ['Documents', 'Photo ID (Aadhaar, passport or driving licence)'],
  ['Documents', 'Tickets and booking confirmations'],
  ['Documents', 'Some cash, plus a card'],
  ['Clothes', 'Everyday clothes'],
  ['Clothes', 'Sleepwear'],
  ['Clothes', 'Comfortable walking shoes'],
  ['Toiletries', 'Toothbrush and toothpaste'],
  ['Toiletries', 'Sunscreen'],
  ['Toiletries', 'Personal medicines'],
  ['Tech', 'Phone charger'],
  ['Tech', 'Power bank'],
];

const BY_VIBE: Record<Vibe, [string, string][]> = {
  hills: [
    ['Clothes', 'Light fleece or jacket for the evenings'],
    ['Clothes', 'Rain jacket or umbrella'],
  ],
  mountains: [
    ['Clothes', 'Warm down jacket'],
    ['Clothes', 'Thermal layers'],
    ['Clothes', 'Woollen hat and gloves'],
    ['Toiletries', 'Lip balm and moisturiser'],
    ['Toiletries', 'Altitude sickness medicine (ask your doctor)'],
  ],
  water: [
    ['Clothes', 'Quick-dry clothes'],
    ['Toiletries', 'Insect repellent'],
    ['Tech', 'Waterproof pouch for your phone'],
  ],
  desert: [
    ['Clothes', 'Sun hat'],
    ['Clothes', 'Scarf against sun and sand'],
    ['Toiletries', 'Sunglasses'],
    ['Toiletries', 'Reusable water bottle'],
  ],
  heritage: [
    ['Clothes', 'Modest clothes for temples'],
    ['Clothes', 'Slip-on shoes (you’ll take them off a lot)'],
  ],
  culture: [['Clothes', 'Modest clothes for villages and temples']],
};

/** A starter list for the vibes of the trip's destinations, without duplicates. */
export function starterPacking(vibes: Vibe[]): PackingItem[] {
  const seen = new Set<string>();
  const rows = [...BASE, ...vibes.flatMap((v) => BY_VIBE[v] ?? [])];
  return rows
    .filter(([, label]) => !seen.has(label) && seen.add(label))
    .map(([group, label]) => ({ id: uid(), group, label, packed: false }));
}
