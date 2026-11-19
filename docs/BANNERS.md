# Event images — official banners vs category placeholders

Every hackathon card has a cover image at the top, in the same 16:9 layout.
A small label on the cover says which kind it is, so the page never
pretends a placeholder is an official banner.

## Official banners — 18 cards

These are the organiser's own banners, taken from the verified assets of
the Muse hackathon page (scans 15–19 Nov 2026). They were extracted from
the exported page, resized to max 1200px wide and saved as WebP in
`public/banners/` — no URL was guessed, and nothing is hotlinked.

| Event | File |
|---|---|
| Configure 2026: A Mobility Hackathon | `configure-2026-a-mobility-hackathon.webp` |
| Seed Hackathon 2026 | `seed-hackathon-2026.webp` |
| Innodata AI Hackathon | `innodata-ai-hackathon.webp` |
| Startup Buildathon India 2026 | `startup-buildathon-india-2026.webp` |
| GeNarrative Clash — Kolkata | `genarrative-clash-kolkata.webp` |
| DevNexus 2.0 — Kolkata — CLOSED | `devnexus-2-0-kolkata-closed.webp` |
| Code N Mod — Tumakuru | `code-n-mod-tumakuru.webp` |
| Founders' House Kolkata | `founders-house-kolkata.webp` |
| Clash of Commits — VIT Chennai | `clash-of-commits-vit-chennai.webp` |
| Health Hackathon 3.0 — VIT Bhopal | `health-hackathon-3-0-vit-bhopal.webp` |
| Hack For Tomorrow 2026 — Kochi | `hack-for-tomorrow-2026-kochi.webp` |
| haxfinity — Nilambur, Kerala | `haxfinity-nilambur-kerala.webp` |
| Hack Nexus 2027 — Nagpur | `hack-nexus-2027-nagpur.webp` |
| Techacks 5.0 — Chitkara University | `techacks-5-0-chitkara-university.webp` |
| HACK 6.0 — NIT Hamirpur | `hack-6-0-nit-hamirpur.webp` |
| doubleSlash 5.0 — Kolkata | `doubleslash-5-0-kolkata.webp` |
| BeachHack Season 8 (MLH 2027) | `beachhack-season-8-mlh-2027.webp` (official logo — shown contained, not stretched) |
| Buildathon 1.0 | `buildathon-1-0.webp` |

Two of these were also recorded as remote URLs in the scan logs, for
reference (the site uses the local files above, not these links):

- Buildathon 1.0 — https://hack4hack.com/api/media/hackathons/buildathon-1-0-7ruu/banner.jpg?v=t163bw65hb
- BeachHack Season 8 logo — https://www.beachhack.in/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fbh8-mark.25wem08hvqhrd.webp&w=384&q=75

## Category placeholders — the other 75 hackathon cards

All other cards use one of four category illustrations, also taken from
the Muse page's own assets and stored locally:

- `public/banners/category-flagship.webp` — in-person flagship events
- `public/banners/category-ai.webp` — AI / GenAI events
- `public/banners/category-online.webp` — online events
- `public/banners/category-student.webp` — student / beginner events

These are **not** the organiser's banner — the card says "Category
illustration". Community events have no cover image in the compact
list layout (`banner: null`).

## Adding a real banner for an event

1. Only use a banner you can verify on the organiser's own listing page
   (Devfolio / Unstop / Hack2Skill / Devpost) or that a scan log records.
2. Save it under `public/banners/<event-slug>.webp` (max 1200px wide).
3. In `data/events.json`, set that event's `banner` to
   `"/banners/<event-slug>.webp"` and `bannerSource` to `"official"`.
4. Never hotlink a guessed URL, and never use a fake organiser logo.

## Schema

Each event in `data/events.json` carries:

- `banner`: `"/banners/<file>.webp"` or `null`
- `bannerSource`: `"official"` | `"placeholder"`
- `bannerFit`: `"cover"` | `"contain"` (`contain` is used for square
  logos such as BeachHack and Startup Buildathon India, so they are not
  stretched)
