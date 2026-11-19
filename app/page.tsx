"use client";

import { useMemo, useState } from "react";
import {
  COMMUNITY_CITIES,
  LAST_SCANNED,
  communityEvents,
  hackathonEvents,
  isClosingSoon,
  watchlistItems,
  type PortalEvent,
} from "../lib/events";

const CITIES = ["Bengaluru", "Pune", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Kolkata", "Nagpur", "Online"];
const NAV = [
  { href: "#home", label: "Home" },
  { href: "#events", label: "Events" },
  { href: "#community", label: "Community" },
  { href: "#planner", label: "Planner" },
  { href: "#sources", label: "Sources" },
];

function Chip({ children, tone = "stone" }: { children: React.ReactNode; tone?: "stone" | "teal" | "amber" | "green" | "red" }) {
  const tones: Record<string, string> = {
    stone: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
    teal: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function Cover({ e }: { e: PortalEvent }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-900">
      {e.banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={e.banner}
          alt={e.bannerSource === "official" ? `Official banner for ${e.title}` : `Category illustration for ${e.title}`}
          loading="lazy"
          className={`h-full w-full ${e.bannerFit === "contain" ? "object-contain p-6" : "object-cover"}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-600 via-indigo-600 to-stone-900 p-6 text-center">
          <span className="text-2xl font-extrabold text-white">{e.title}</span>
        </div>
      )}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">{e.category}</span>
        {e.bestFit && <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950">⭐ Best fit</span>}
      </div>
      {e.status === "closed" && (
        <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Closed</span>
      )}
      {e.status === "unconfirmed" && (
        <span className="absolute right-3 top-3 rounded-full bg-yellow-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-yellow-950">Unconfirmed</span>
      )}
      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
        {e.bannerSource === "official" ? "Official banner" : "Category illustration"}
      </span>
    </div>
  );
}

function EventCard({ e }: { e: PortalEvent }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-lg dark:border-stone-800 dark:bg-stone-900">
      <Cover e={e} />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug">{e.title}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>📅 {e.dates || "Dates TBA"}</Chip>
          {e.mode && <Chip tone="teal">{e.mode === "online" ? "🌐 Online" : e.mode === "hybrid" ? "Hybrid" : "📍 Offline"}</Chip>}
          {e.city && <Chip>📍 {e.city}</Chip>}
          {e.fee && <Chip tone="green">{e.fee}</Chip>}
        </div>
        {e.prize && (
          <p className="mt-3 text-base font-extrabold text-stone-900 dark:text-white">
            🏆 {e.prize} <span className="text-xs font-medium text-stone-500">prize</span>
          </p>
        )}
        {e.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{e.description}</p>}
        {e.teams && <p className="mt-1 text-xs text-stone-500">{e.teams}</p>}
        {e.notes && <p className="mt-3 rounded-lg bg-yellow-50 p-2.5 text-xs leading-relaxed text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">⚠ {e.notes}</p>}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
          <div className="text-sm">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-stone-400">Deadline</span>
            <span className="font-bold text-amber-700 dark:text-amber-300">{e.deadline || "TBA"}</span>
          </div>
          {e.verified && <Chip tone="green">✓ Verified</Chip>}
        </div>
        {e.link ? (
          <a href={e.link} target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-teal-800">
            Apply →
          </a>
        ) : (
          <span className="mt-4 block rounded-xl bg-stone-100 px-4 py-3 text-center text-sm font-semibold text-stone-500 dark:bg-stone-800">
            Link unconfirmed — check the organiser page
          </span>
        )}
        {e.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {e.tags.map((t) => (
              <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">{t}</span>
            ))}
          </div>
        )}
        {e.source && <p className="mt-2 text-[11px] text-stone-400">Source: {e.source}{e.addedDate ? ` · Added ${e.addedDate}` : ""}</p>}
      </div>
    </article>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("");
  const [fee, setFee] = useState("");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState("");
  const [timing, setTiming] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [aiOnly, setAiOnly] = useState(false);
  const [soonOnly, setSoonOnly] = useState(false);
  const [forYou, setForYou] = useState(false);
  const [communityCity, setCommunityCity] = useState("All");

  // No default filter: every filter starts empty/off, so All events show by default.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hackathonEvents.filter((e) => {
      if (q && ![e.title, e.description, e.dates, e.city, e.deadline, e.category, ...(e.tags || [])].join(" ").toLowerCase().includes(q)) return false;
      if (theme === "ai" && !/ai|genai|agent|ml/i.test([e.title, e.category, ...(e.tags || [])].join(" "))) return false;
      if (fee === "free" && e.fee !== "Free") return false;
      if (fee === "paid" && e.fee === "Free") return false;
      if (city && !(e.city || "").toLowerCase().includes(city.toLowerCase())) return false;
      if (mode && e.mode !== mode) return false;
      if (timing === "soon" && !isClosingSoon(e)) return false;
      if (timing === "dec" && !/Dec 2026/.test(`${e.dates} ${e.deadline}`)) return false;
      if (timing === "jan" && !/Jan 2027/.test(`${e.dates} ${e.deadline}`)) return false;
      if (timing === "later" && !/Feb 2027|Mar 2027|Apr 2027/.test(`${e.dates} ${e.deadline}`)) return false;
      if (freeOnly && e.fee !== "Free") return false;
      if (aiOnly && !/ai|genai|agent/i.test([e.title, e.category, ...(e.tags || [])].join(" "))) return false;
      if (soonOnly && !isClosingSoon(e)) return false;
      if (forYou && !e.bestFit && !/ai|agent/i.test(e.category)) return false;
      return true;
    });
  }, [query, theme, fee, city, mode, timing, freeOnly, aiOnly, soonOnly, forYou]);

  const closingSoon = useMemo(() => hackathonEvents.filter(isClosingSoon), []);
  const communityFiltered = useMemo(
    () => (communityCity === "All" ? communityEvents : communityEvents.filter((e) => e.city === communityCity)),
    [communityCity]
  );

  return (
    <div className="min-h-screen bg-stone-100 pb-20 text-stone-900 md:pb-0 dark:bg-stone-950 dark:text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <a href="#home" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-lg font-extrabold text-white">⌘</span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight">Hackathon Portal</span>
              <span className="block text-[11px] font-medium text-stone-500">For engineering students · India</span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
                {n.label}
              </a>
            ))}
          </nav>
          <span className="hidden rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800 sm:block dark:bg-green-900 dark:text-green-200">
            ● Updated {LAST_SCANNED}
          </span>
        </div>
      </header>

      <main id="home" className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-indigo-700 to-stone-900 p-6 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-200">Devfolio · Unstop · Hack2Skill · MLH · Devpost — in one place</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Don&apos;t just attend one. Pick the right 4–5 and build for them.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-teal-100 sm:text-lg">
            Hackathons and community events for engineering students — AI / GenAI agents, Next.js, React, TypeScript and Python.
            <strong className="text-white"> Pick it here. Apply yourself.</strong> No auto-apply, ever.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{hackathonEvents.length} hackathons</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{communityEvents.length} community events</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{closingSoon.length} closing soon</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">All events shown by default</span>
          </div>
          <div className="mt-6">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hackathons — try 'Pune', 'AI agents', 'online', '₹1 lakh'…"
              className="w-full max-w-xl rounded-2xl border-0 bg-white px-5 py-3.5 text-base text-stone-900 shadow-lg outline-none placeholder:text-stone-400 focus:ring-4 focus:ring-teal-300"
            />
          </div>
        </section>

        {/* January clash */}
        <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950">
          <h2 className="font-bold">⚠ January clash — plan around it</h2>
          <p className="mt-1 text-sm leading-relaxed">
            CMR Hackfest 8–9 Jan, Goa Buildathon 16–17 Jan, and Innerve 11.0 / Hackcelerate 29–30 Jan 2027 clash with the hackathon being organised in January 2027.
            Pick 4–5 events, not all of them. HackKumbh 2026 Stage 1 PPT was due 20 Nov 2026.
          </p>
        </section>

        {/* Events */}
        <section id="events" className="mt-12 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">All hackathons</h2>
              <p className="mt-1 text-sm text-stone-500">One filterable list. Nothing is filtered by default — &ldquo;For you&rdquo; is an optional manual filter.</p>
            </div>
            <span className="text-sm font-semibold text-stone-500">Showing {filtered.length} of {hackathonEvents.length}</span>
          </div>

          <div className="sticky top-[57px] z-30 mt-5 rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
            <div className="flex flex-wrap gap-2">
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="rounded-full border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900" aria-label="Theme">
                <option value="">All themes</option><option value="ai">AI / GenAI</option>
              </select>
              <select value={fee} onChange={(e) => setFee(e.target.value)} className="rounded-full border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900" aria-label="Fee">
                <option value="">Any fee</option><option value="free">Free only</option><option value="paid">Paid entry</option>
              </select>
              <select value={timing} onChange={(e) => setTiming(e.target.value)} className="rounded-full border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900" aria-label="Timing">
                <option value="">Any date</option><option value="soon">Closing soon</option><option value="dec">December 2026</option><option value="jan">January 2027</option><option value="later">Feb 2027 onwards</option>
              </select>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-full border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900" aria-label="City">
                <option value="">All cities</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-full border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900" aria-label="Mode">
                <option value="">Online / offline / hybrid</option><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option>
              </select>
              <button onClick={() => setFreeOnly(!freeOnly)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${freeOnly ? "border-teal-700 bg-teal-700 text-white" : ""}`}>Free only</button>
              <button onClick={() => setAiOnly(!aiOnly)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${aiOnly ? "border-teal-700 bg-teal-700 text-white" : ""}`}>AI / GenAI</button>
              <button onClick={() => setSoonOnly(!soonOnly)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${soonOnly ? "border-teal-700 bg-teal-700 text-white" : ""}`}>Closing soon</button>
              <button onClick={() => setForYou(!forYou)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${forYou ? "border-teal-700 bg-teal-700 text-white" : ""}`}>For you (optional)</button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => <EventCard key={e.id} e={e} />)}
          </div>
          {filtered.length === 0 && <p className="mt-6 rounded-2xl border bg-white p-6 text-center text-stone-500 dark:bg-stone-900">No events match those filters. Clear a filter to see all events again.</p>}
        </section>

        {/* Planner */}
        <section id="planner" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Planner — what to do, in what order</h2>
          <p className="mt-1 text-sm text-stone-500">Closing soon: open events with a Nov / early-Dec 2026 deadline. Deadlines change — always verify on the official page before applying.</p>
          <ol className="mt-5 space-y-2">
            {closingSoon.map((e, i) => (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-extrabold text-white">{i + 1}</span>
                <span className="flex-1"><strong>{e.title}</strong> — {e.deadline || e.dates || "deadline TBA"}</span>
                {e.link && <a className="shrink-0 font-bold text-teal-700 underline" href={e.link} target="_blank" rel="noopener noreferrer">Apply →</a>}
              </li>
            ))}
            {closingSoon.length === 0 && <li className="text-sm text-stone-500">Nothing closing in the next few days in this snapshot.</li>}
          </ol>
        </section>

        {/* Community */}
        <section id="community" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Community events</h2>
          <p className="mt-1 text-sm text-stone-500">Meetups, pitch days, demo days and dev festivals — not hackathons — grouped by city.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["All", ...COMMUNITY_CITIES].map((c) => (
              <button key={c} onClick={() => setCommunityCity(c)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${communityCity === c ? "border-teal-700 bg-teal-700 text-white" : "bg-white dark:bg-stone-900"}`}>{c}</button>
            ))}
          </div>
          <div className="mt-6 space-y-8">
            {COMMUNITY_CITIES.filter((c) => communityCity === "All" || communityCity === c).map((cityName) => {
              const items = communityFiltered.filter((e) => e.city === cityName);
              if (!items.length) return null;
              return (
                <div key={cityName}>
                  <h3 className="text-lg font-bold">📍 {cityName} <span className="text-sm font-semibold text-stone-500">({items.length})</span></h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {items.map((e) => (
                      <div key={e.id} className="rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900">
                        <p className="font-bold">{e.bestFit ? "⭐ " : ""}{e.title}</p>
                        <p className="mt-1 leading-relaxed text-stone-600 dark:text-stone-300">{e.description || e.dates || ""}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-2">
                          {e.fee && <Chip>{e.fee}</Chip>}
                          {e.link ? <a className="font-bold text-teal-700 underline" href={e.link} target="_blank" rel="noopener noreferrer">View →</a> : <span className="text-stone-500">No link captured — search the organiser page.</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Watchlist */}
        <section id="watchlist" className="mt-14">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Watch-list — unconfirmed</h2>
          <p className="mt-1 text-sm text-stone-500">Aggregator listings only. Details are not verified on organiser pages — check the official listing before planning anything.</p>
          <ul className="mt-5 space-y-2 text-sm">
            {watchlistItems.map((w, i) => (
              <li key={i} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <strong>{w.title}</strong> — {w.details}
                {w.link && <> · <a className="font-bold text-teal-700 underline" href={w.link} target="_blank" rel="noopener noreferrer">Listing →</a></>}
              </li>
            ))}
          </ul>
        </section>

        {/* Sources */}
        <section id="sources" className="mt-14 scroll-mt-24 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Sources — how this list stays up to date</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            This page is a dated snapshot, last scanned {LAST_SCANNED}. It does not fetch live listings when you open it — it is refreshed by a daily scan.
            Sources: Unstop, Devfolio, Hack2Skill, MLH (public listings only), Devpost and HackerEarth.
            Devfolio session was expired at the last scan, so Devfolio entries come from public listings only.
            Unstop / Devfolio / Hack2Skill are login- or JS-protected, so their new listings come from the daily Muse scan, not from the automatic GitHub Action (see README and docs/ARCHITECTURE.md).
            Event images: 18 cards use the organiser&apos;s official banner (extracted from the Muse page&apos;s verified assets, stored in <code>public/banners/</code>); all other cards use a category illustration, labelled on the card — see <code>docs/BANNERS.md</code>. No banner URL was invented.
          </p>
          <p className="mt-3 text-sm">Built by Pranav Shinde · Open source (MIT) · <a className="font-bold text-teal-700 underline" href="https://github.com/Iampranav009" target="_blank" rel="noopener noreferrer">github.com/Iampranav009</a></p>
        </section>

        <footer className="mt-12 border-t border-stone-200 pt-5 pb-6 text-center text-xs text-stone-500 dark:border-stone-800">
          Pick it here. Apply yourself. · Last scanned {LAST_SCANNED} · Data: data/events.json + data/community.json · JSON is the database — see docs/ARCHITECTURE.md
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/95">
        <div className="grid grid-cols-5 text-center text-[11px] font-bold">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="py-3 text-stone-600 hover:text-teal-700 dark:text-stone-300">{n.label}</a>
          ))}
        </div>
      </nav>
    </div>
  );
}
