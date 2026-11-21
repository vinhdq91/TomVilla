# Tom's House — villa website

Astro + Tailwind, hosted on Cloudflare. Content is edited in the Keystatic admin panel.

## Commands

| Command | What it does |
| --- | --- |
| `npm run admin` | Site **plus admin panel** at http://127.0.0.1:4321/keystatic — use this to edit text, photos and icons |
| `npm run dev` | Site only, running in Cloudflare's runtime (same as production) |
| `npm run build` | Build the site into `dist/` |
| `npm run preview` | Preview the built site |

## Where things live

| What | Where |
| --- | --- |
| Editable content (text, FAQs, contacts) | `src/content/` (YAML, edited via the admin panel) |
| Photos | `src/assets/images/` (auto-optimised at build time) |
| Page sections | `src/components/home/` |
| Colours & fonts | `src/styles/global.css` (`@theme`) |
| Admin panel fields | `keystatic.config.ts` (keep in sync with `src/content.config.ts`) |
| Availability (iCal now, D1 later) | `src/lib/booking/availability.ts` |

## Still to do

- Replace placeholder photos and contact details (WhatsApp, Zalo, email, address)
- Choose a domain and set `site` in `astro.config.mjs`
- Push to GitHub and connect Cloudflare Pages
- Switch Keystatic to GitHub mode so the admin panel works online
