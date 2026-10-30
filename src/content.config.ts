import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const VIBES = ['hills', 'water', 'heritage', 'desert', 'mountains', 'culture'] as const;

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      state: z.string(),
      tagline: z.string(),
      vibes: z.array(z.enum(VIBES)).min(1),
      /** Months that are pleasant to visit, 1 = January. */
      bestMonths: z.array(z.number().int().min(1).max(12)).min(1),
      /** Rough spend per person per day in INR, excluding travel to get there. */
      budgetPerDay: z.object({ low: z.number(), high: z.number() }),
      daysNeeded: z.object({ min: z.number(), max: z.number() }),
      coordinates: z.object({ lat: z.number(), lng: z.number() }),
      gettingThere: z.string(),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      hero: image(),
      heroAlt: z.string(),
      credit: z.object({
        author: z.string(),
        license: z.string(),
        source: z.url(),
      }),
    }),
});

export const collections = { destinations };
