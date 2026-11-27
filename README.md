# Tom Villa — villa website

Astro + Tailwind, hosted on Cloudflare. Content is edited in the Keystatic admin panel.

## Commands

| Command | What it does |
| --- | --- |
| `npm run admin` | Site **plus admin panel** at http://127.0.0.1:4321/keystatic — use this to edit text, photos and icons |
| `npm run dev` | Site only, running in Cloudflare's runtime (same as production) |
| `npm run build` | Build the site into `dist/` |
| `npm run preview` | Preview the built site |
| `npm run db:migrate:local` | Create/update the booking tables in the local database |
| `npm run db:generate` | After editing `src/db/schema.ts`: write a new SQL migration |
| `npm run deploy` | Update the online database tables, then deploy (Cloudflare deploy command) |

`npm run dev` needs `ADMIN_PASSWORD=...` in `.env` to log in at `/admin`.
Booking pages don't work under `npm run admin` (Node runtime has no D1) — use `npm run dev` for them.

## Where things live

| What | Where |
| --- | --- |
| Editable content (text, FAQs, contacts) | `src/content/` (YAML, edited via the admin panel) |
| Photos | `src/assets/images/` (auto-optimised at build time) |
| Page sections | `src/components/home/` |
| Colours & fonts | `src/styles/global.css` (`@theme`) |
| Admin panel fields | `keystatic.config.ts` (keep in sync with `src/content.config.ts`) |
| Booking settings & prices | `src/content/singletons/booking.yaml` (admin: *Booking & prices*) |
| Price calculation | `src/lib/booking/pricing.ts` (used by the browser and the server) |
| Bookings, availability, double-booking check | `src/lib/booking/server.ts` |
| Database tables | `src/db/schema.ts` → `migrations/` |
| Guest pages | `src/pages/book.astro`, `src/pages/booking/[token].astro` |
| Owner dashboard (password: `ADMIN_PASSWORD` secret) | `src/pages/admin/`, `src/lib/admin/` |
| Calendar export for Airbnb / Booking.com | `/calendar.ics` (`src/pages/calendar.ics.ts`) |

## Still to do

- Replace placeholder photos and contact details (WhatsApp, Zalo, email, address)
- Choose a domain and set `site` in `astro.config.mjs`
- Booking part 2: PayPal, WhatsApp alerts to the owner
- Guest emails (needs a domain)
