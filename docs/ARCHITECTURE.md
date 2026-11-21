# Architecture — Hackathon Portal

## v1: JSON is the database (file-based, version-controlled, free, no server)

There is no database server in v1, on purpose. The data lives in two JSON
files in the repo, and **that is the database**:

- `data/events.json` — hackathons (93 at launch, last scanned 2026-11-19)
- `data/community.json` — community / startup events, grouped by `city`
  (305 at launch: Bengaluru 124, Delhi/NCR 60, Mumbai 46, Online/Other 38,
  Pune 21, Chennai 16)
- `data/watchlist.json` — 59 unconfirmed aggregator mentions (compact list,
  not full cards)

Why JSON first:

- Free — no database bill, no server, no API keys.
- Version-controlled — every change is a git commit, so a bad edit can be
  reverted and the history shows when each event was added.
- Editable by anyone — a contributor adds an event by editing one JSON
  object and opening a pull request. No admin panel needed.
- Fast — Next.js imports the JSON at build time; Vercel serves a static
  site. No runtime database query on any page view.

The UI (`app/page.tsx`) reads the JSON through `lib/events.ts` and renders
it client-side with search + manual filters. No filter is pre-selected:
all events show by default.

## "Must Attend" — the shortlist page (`/must-attend`)

`app/must-attend/page.tsx` lists only the events Pranav should actually
register for or visit. The rule lives in `lib/events.ts` as
`isMustAttend(e)` and uses only fields already in the JSON — no new
fields, nothing invented:

1. **Open only** — `status === "open"`.
2. **Relevant** — `bestFit === true`, OR the event's `category` / `tags`
   mention AI / GenAI / agents / ML **and** its fee is free or low-cost
   (fee starts with "Free", or a stated ₹ amount of ₹600 or less).
   A `null` fee counts as "unknown", not free.
3. **Reachable** — `mode === "online"`, or `city` is Bengaluru, Pune,
   Mumbai, Delhi, Chennai, Nagpur, Amravati or Yavatmal (a city string
   containing "Online" counts as online). An event with no city recorded
   and a hybrid/offline mode cannot qualify on location.

On 19 Nov 2026 the rule selected **23 hackathons and 33 community
events (56 total)** from the 94 + 305 in the data. 21 of the 23
hackathons were closing soon by the `isClosingSoon` deadline rule;
community events carry no `deadline` field in the data (all null), so
they are not counted as closing soon — that is a data gap, not "none
soon".

On the 21 Nov 2026 sync the rule selected **25 hackathons and 34
community events (59 total)** from the 224 + 334 in the data; 16 of
the 25 hackathons were closing soon.

The page's filters are exactly four toggle chips plus All: **Free**,
**Paid**, **Hackathons**, **Community Events**. Free/Paid filter by fee
(Free = fee starts with "Free"; Paid = a stated paid fee; unknown fees
appear under All only), Hackathons/Community filter by type, and the two
dimensions combine (e.g. Free + Hackathons). Default is All, no filter
pre-selected — same as the home page.

Examples of events that looked must-attend but were excluded, and why:
Innodata AI Hackathon (AI, free, ₹10L) — hybrid with no city recorded,
so location could not be verified; HackSprint 3.0 (AI, free) — offline
in Coimbatore, outside the reachable cities; Relate by Neo4j and
#BuildHybridAI 2026 — Best fit but status "unconfirmed", not open.
AWS MSP AI Hackathon *is* included (Best fit, online, free) even though
earlier scans flagged it as MSP-partner-only — check eligibility on the
official page before applying; the card's own notes/source should be
read, not just the shortlist.

## Daily updates — two tracks

### Track A: automatic (GitHub Action, public sources only)

`.github/workflows/daily-update.yml` runs daily at 03:00 UTC (08:30 IST)
and runs `scripts/update-events.mjs`. That script fetches **public,
no-login sources only** — currently the Devpost hackathons RSS feed —
normalises new items into the same JSON schema, dedupes by title + link,
and only *adds* new events. It never overwrites a manually verified field
with a blank: existing entries are left completely untouched, and only the
top-level `lastScanned` date is updated.

If the JSON changed, the Action commits and pushes it. Vercel then
redeploys automatically (a normal Vercel–GitHub integration). The Action
needs **no secrets** — the sources are public.

### Track B: daily Muse scan (login / JS-protected sources)

Unstop, Devfolio and Hack2Skill are login- or JS-protected, so the script
above deliberately does **not** attempt their logins. New listings from
those platforms come from the daily Muse scan: the scan verifies date,
mode/city, eligibility, fee, deadline and official link, and the verified
entries are committed to `data/events.json` / `data/community.json`
(manually, or pasted in as a JSON update). That is also how the 93 + 305
launch entries were built (scans 15–19 Nov 2026).

Rule for both tracks: **never invent an event, date, prize or link.**
Unknown fields stay `null` / `"TBA"` / `"Unconfirmed"`.

## JSON schema — designed 1:1 for a future Supabase table

Every event object already uses the field names a Postgres table would use,
so a future migration is a mechanical copy, not a redesign:

| JSON field | Supabase / Postgres type | Notes |
|---|---|---|
| `id` | `text primary key` | slugified title (see `slug`) |
| `title` | `text not null` | |
| `slug` | `text unique not null` | URL-safe, from title |
| `dates` | `text` | human-readable event dates, e.g. "29–30 Jan 2027" |
| `deadline` | `text` | human-readable deadline, e.g. "Apply by ~30 Dec 2026" |
| `city` | `text` | e.g. "Pune", "Online" |
| `mode` | `text` | `online` / `offline` / `hybrid` |
| `fee` | `text` | e.g. "Free", "₹500", `null` if unknown |
| `prize` | `text` | e.g. "₹12,00,000+", `null` if unknown |
| `link` | `text` | official / organiser link, `null` if unconfirmed |
| `source` | `text` | Devfolio / Unstop / Hack2Skill / Devpost / MLH / Techsnap … |
| `category` | `text` | e.g. "Flagship", "AI / GenAI", "New — 19 Nov", "Community" |
| `bestFit` | `boolean default false` | matches Pranav's stack (AI agents, Next.js/React/TS/Python, free, student-eligible) |
| `verified` | `boolean default false` | checked against the organiser's own page |
| `banner` | `text` | local cover image, e.g. `"/banners/buildathon-1-0.webp"`, or `null` |
| `bannerSource` | `text` | `official` (organiser's banner) or `placeholder` (category illustration) |
| `bannerFit` | `text` | `cover` or `contain` (square logos) |
| `lastScanned` | `date` | e.g. "2026-11-19" |

`tags` is a `text[]` in Postgres. `description`, `teams`, `notes` and
`addedDate` map to `text`, `text`, `text` and `date`. `status` is a
`text` check (`open` / `closed` / `unconfirmed` / `ended`).

Community events use the exact same schema, with `category = "Community"`
and `city` in Bengaluru / Pune / Mumbai / Delhi/NCR / Chennai /
Online/Other.

### Future Supabase migration path (when it is needed)

Do **not** add Supabase now. Add it only when one of these is needed:

1. **User submissions** — visitors suggest an event from the site itself.
   Then: a `submissions` table (same columns + `submitted_by`, `status =
   pending/approved/rejected`), a server action / API route that inserts
   with `status = pending`, and an admin who approves into `events`.
2. **Admin panel** — editing events in a browser instead of in JSON.
   Then: Supabase Auth (one admin user) + Row Level Security so only the
   admin can write, everyone else reads.
3. **Live data** — events change faster than a daily commit can follow.
   Then: replace the JSON import in `lib/events.ts` with a Supabase
   `select()` call (server component), keeping the same field names, so
   the UI code barely changes.

Migration steps, when that day comes:

```sql
create table events (
  id text primary key,
  title text not null,
  slug text unique not null,
  dates text,
  deadline text,
  city text,
  mode text,
  fee text,
  prize text,
  link text,
  source text,
  category text,
  tags text[] default '{}',
  best_fit boolean default false,
  verified boolean default false,
  status text default 'open',
  description text,
  teams text,
  notes text,
  added_date date,
  last_scanned date
);
-- then import data/events.json + data/community.json (one row per object),
-- enable RLS, add a read-only policy for anon, write policy for the admin.
```

Until then, JSON is the database — and the site stays free, fast and
simple.
