import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { galleryCategories } from './lib/gallery';

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

// YAML may store dates as text or as real dates; always give YYYY-MM-DD text.
const isoDate = z.union([z.string(), z.date()]).transform((v) => (typeof v === 'string' ? v : v.toISOString().slice(0, 10)));

const booking = defineCollection({
  loader: glob({ pattern: 'booking.yaml', base: './src/content/singletons' }),
  schema: z.object({
    nightlyPrice: z.number().int().min(0),
    weekendPrice: z.number().int().nullish().transform((v) => v ?? 0),
    minNights: z.number().int().min(1).default(1),
    maxGuests: z.number().int().min(1),
    cleaningFee: z.number().int().nullish().transform((v) => v ?? 0),
    seasons: z
      .array(
        z.object({
          name: z.string(),
          start: isoDate,
          end: isoDate,
          nightlyPrice: z.number().int().min(0),
          weekendPrice: z.number().int().nullish().transform((v) => v ?? 0),
          minNights: z.number().int().nullish().transform((v) => v ?? 0),
        }),
      )
      .default([]),
    paymentOptions: z.array(z.enum(['30', '50', '100'])).min(1).default(['30', '50', '100']),
    cancellationDays: z.enum(['7', '14']).transform(Number),
    holdHours: z.number().int().min(1).default(2),
    bookAheadMonths: z.number().int().min(1).default(12),
    bank: z.object({ bin: z.string(), accountNumber: z.string(), accountName: z.string() }),
    calendarFeeds: z.array(z.object({ source: z.string(), url: z.url() })).default([]),
    intro: z.string().default(''),
    houseRules: z.string().default(''),
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

const gallery = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/gallery' }),
  schema: ({ image }) =>
    z.object({
      caption: z.string(),
      category: z.enum(galleryCategories.map((c) => c.value) as [string, ...string[]]),
      order: z.number().default(10),
      image: image(),
    }),
});

export const collections = { site, booking, home, spaces, gallery };
