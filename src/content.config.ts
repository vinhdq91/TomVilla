import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// These schemas mirror keystatic.config.ts. Change both together.

const site = defineCollection({
  loader: glob({ pattern: 'site.yaml', base: './src/content/singletons' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    seoDescription: z.string(),
    whatsapp: z.string(),
    zalo: z.string(),
    phone: z.string(),
    email: z.string(),
    address: z.string(),
    mapQuery: z.string(),
    hideFromSearch: z.boolean().default(true),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: 'home.yaml', base: './src/content/singletons' }),
  schema: ({ image }) =>
    z.object({
      hero: z.object({
        title: z.string(),
        subtitle: z.string(),
        text: z.string(),
        buttonLabel: z.string(),
        image: image(),
      }),
      villa: z.object({
        eyebrow: z.string(),
        heading: z.string(),
        text: z.string(),
        amenities: z.array(z.object({ icon: z.string(), label: z.string() })),
      }),
      stay: z.object({
        eyebrow: z.string(),
        heading: z.string(),
        steps: z.array(z.object({ icon: z.string(), title: z.string(), text: z.string() })),
        bookingTitle: z.string(),
        bookingText: z.string(),
      }),
      location: z.object({
        eyebrow: z.string(),
        heading: z.string(),
        text: z.string(),
        image: image().nullish(),
        distances: z.array(z.object({ place: z.string(), time: z.string() })),
      }),
      faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
    }),
});

const spaces = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/spaces' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      order: z.number().default(1),
      summary: z.string(),
      image: image(),
    }),
});

export const collections = { site, home, spaces };
