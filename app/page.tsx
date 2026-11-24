"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, Heart, MapPin, ShieldAlert, Star } from "lucide-react";
import {
  COMMUNITY_CITIES,
  LAST_SCANNED,
  communityEvents,
  hackathonEvents,
  isClosingSoon,
  mustAttendEvents,
  watchlistItems,
} from "../lib/events";
import { EventCard } from "./components/EventCard";
import { MobileNav, SiteFooter, SiteHeader } from "./components/SiteChrome";

const CITIES = ["Bengaluru", "Pune", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Kolkata", "Nagpur", "Online"];

const selectCls =
  "rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900";
const toggleCls = (active: boolean) =>
  `rounded-full border px-3 py-2 text-sm font-semibold ${
    active ? "border-teal-700 bg-teal-700 text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-teal-700"
  }`;

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
  const [showAllClosing, setShowAllClosing] = useState(false);

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
  // Trust numbers, computed from the data — never typed by hand.
  const trust = useMemo(
    () => ({
      verified: hackathonEvents.filter((e) => e.verified).length,
      unconfirmed: hackathonEvents.filter((e) => e.status === "unconfirmed").length,
      closed: hackathonEvents.filter((e) => e.status === "closed" || e.status === "ended").length,
      noLink: hackathonEvents.filter((e) => !e.link).length,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-neutral-100 pb-20 text-neutral-900 md:pb-0">
      <SiteHeader current="home" />

      <main id="home" className="mx-auto max-w-6xl px-5">
        {/* Hero — solid teal, no gradient, same as Must Attend */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-teal-700 p-6 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-100">
            Devfolio · Unstop · Hack2Skill · MLH · Devpost — in one place
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Don&apos;t just attend one. Pick the right 4–5 and build for them.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-teal-100 sm:text-lg">
            Hackathons and community events for engineering students — AI / GenAI agents, Next.js, React, TypeScript and Python.
            <strong className="text-white"> Pick it here. Apply yourself.</strong> No auto-apply, ever.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-white/15 px-3 py-1.5">{hackathonEvents.length} hackathons</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5">{communityEvents.length} community events</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5">{closingSoon.length} closing soon</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5">All events shown by default</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/must-attend"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-teal-800 shadow-lg hover:bg-teal-50"
            >
              <Star className="h-4 w-4" /> Must Attend — {mustAttendEvents.length} shortlisted for you
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/swipe"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/60 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
            >
              <Heart className="h-4 w-4" /> Swipe hackathons — one card at a time
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-6">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hackathons — try 'Pune', 'AI agents', 'online', '₹1 lakh'…"
              aria-label="Search hackathons"
              className="w-full max-w-xl rounded-2xl border-0 bg-white px-5 py-3.5 text-base text-neutral-900 shadow-lg outline-none placeholder:text-neutral-400 focus:ring-4 focus:ring-teal-300"
            />
          </div>
        </section>

        {/* Trust strip — credibility up front, visible on mobile too */}
        <section
          aria-label="About this data"
          className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 text-sm leading-relaxed text-neutral-600"
        >
          <p>
            <strong className="text-neutral-900">Last scanned {LAST_SCANNED}.</strong> This is a dated snapshot,
            refreshed by a daily scan — it does not fetch live listings when you open it.{" "}
            {trust.verified} of {hackathonEvents.length} hackathons are verified against the organiser&apos;s page;{" "}
            {trust.unconfirmed} are unconfirmed and {trust.closed} are closed; {trust.noLink} have no official link
            captured. Unconfirmed entries are labelled, never presented as certain — always verify the deadline on the
            official page before applying.
          </p>
        </section>

        {/* January clash */}
        <section className="mt-6 flex gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-bold text-neutral-900">January clash — plan around it</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              CMR Hackfest 8–9 Jan, Goa Buildathon 16–17 Jan, and Innerve 11.0 / Hackcelerate 29–30 Jan 2027 clash with
              the hackathon being organised in January 2027. Pick 4–5 events, not all of them. HackKumbh 2026 Stage 1
              PPT was due 20 Nov 2026.
            </p>
          </div>
        </section>

        {/* Events */}
        <section id="events" className="mt-12 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">All hackathons</h2>
              <p className="mt-1 text-sm text-neutral-500">
                One filterable list. Nothing is filtered by default — &ldquo;For you&rdquo; is an optional manual filter.
              </p>
            </div>
            <span className="text-sm font-semibold text-neutral-500">
              Showing {filtered.length} of {hackathonEvents.length}
            </span>
          </div>

          <div className="sticky top-[57px] z-30 mt-5 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            <div className="flex flex-wrap gap-2">
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className={selectCls} aria-label="Theme">
                <option value="">All themes</option>
                <option value="ai">AI / GenAI</option>
              </select>
              <select value={fee} onChange={(e) => setFee(e.target.value)} className={selectCls} aria-label="Fee">
                <option value="">Any fee</option>
                <option value="free">Free only</option>
                <option value="paid">Paid entry</option>
              </select>
              <select value={timing} onChange={(e) => setTiming(e.target.value)} className={selectCls} aria-label="Timing">
                <option value="">Any date</option>
                <option value="soon">Closing soon</option>
                <option value="dec">December 2026</option>
                <option value="jan">January 2027</option>
                <option value="later">Feb 2027 onwards</option>
              </select>
              <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls} aria-label="City">
                <option value="">All cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={selectCls} aria-label="Mode">
                <option value="">Online / offline / hybrid</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <button onClick={() => setFreeOnly(!freeOnly)} aria-pressed={freeOnly} className={toggleCls(freeOnly)}>
                Free only
              </button>
              <button onClick={() => setAiOnly(!aiOnly)} aria-pressed={aiOnly} className={toggleCls(aiOnly)}>
                AI / GenAI
              </button>
              <button onClick={() => setSoonOnly(!soonOnly)} aria-pressed={soonOnly} className={toggleCls(soonOnly)}>
                Closing soon
              </button>
              <button onClick={() => setForYou(!forYou)} aria-pressed={forYou} className={toggleCls(forYou)}>
                For you (optional)
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
              <p className="font-bold text-neutral-900">No events match those filters</p>
              <p className="mt-1 text-sm text-neutral-500">Clear a filter to see all events again.</p>
            </div>
          )}
        </section>

        {/* Planner */}
        <section id="planner" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
            Planner — what to do, in what order
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Closing soon: open events with a deadline in the next 30 days. Deadlines change — always verify on the
            official page before applying.
          </p>
          <ol className="mt-5 space-y-2">
            {(showAllClosing ? closingSoon : closingSoon.slice(0, 12)).map((e, i) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="flex-1">
                  <strong>{e.title}</strong> — {e.deadline || e.dates || "deadline TBA"}
                </span>
                {e.link && (
                  <a
                    className="inline-flex shrink-0 items-center gap-1 font-bold text-teal-700"
                    href={e.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </li>
            ))}
            {closingSoon.length === 0 && (
              <li className="text-sm text-neutral-500">Nothing closing in the next few days in this snapshot.</li>
            )}
          </ol>
          {closingSoon.length > 12 && (
            <button
              onClick={() => setShowAllClosing(!showAllClosing)}
              className="mt-4 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-teal-700"
            >
              {showAllClosing ? "Show fewer" : `Show all ${closingSoon.length} closing soon`}
            </button>
          )}
        </section>

        {/* Community */}
        <section id="community" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">Community events</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Meetups, pitch days, demo days and dev festivals — not hackathons — grouped by city.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["All", ...COMMUNITY_CITIES].map((c) => (
              <button
                key={c}
                onClick={() => setCommunityCity(c)}
                aria-pressed={communityCity === c}
                className={toggleCls(communityCity === c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-8">
            {COMMUNITY_CITIES.filter((c) => communityCity === "All" || communityCity === c).map((cityName) => {
              const items = communityFiltered.filter((e) => e.city === cityName);
              if (!items.length) return null;
              return (
                <div key={cityName}>
                  <h3 className="flex items-center gap-1.5 text-lg font-bold text-neutral-900">
                    <MapPin className="h-5 w-5 text-teal-700" /> {cityName}
                    <span className="text-sm font-semibold text-neutral-500">({items.length})</span>
                  </h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {items.map((e) => (
                      <div key={e.id} className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
                        <p className="flex items-start justify-between gap-2 font-bold text-neutral-900">
                          <span>
                            {e.bestFit ? "Best fit — " : ""}
                            {e.title}
                          </span>
                          {e.verified ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                              <BadgeCheck className="h-3 w-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                              <ShieldAlert className="h-3 w-3" /> Unverified
                            </span>
                          )}
                        </p>
                        <p className="mt-1 leading-relaxed text-neutral-600">{e.description || e.dates || ""}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-2">
                          {e.fee && (
                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                              {e.fee}
                            </span>
                          )}
                          {e.link ? (
                            <a
                              className="inline-flex items-center gap-1 font-bold text-teal-700"
                              href={e.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View <ArrowRight className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-neutral-500">No link captured — search the organiser page.</span>
                          )}
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
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
            Watch-list — unconfirmed
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Aggregator listings only. Details are not verified on organiser pages — check the official listing before
            planning anything.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {watchlistItems.map((w, i) => (
              <li key={i} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <strong>{w.title}</strong> — {w.details}
                {w.link && (
                  <>
                    {" · "}
                    <a
                      className="inline-flex items-center gap-1 font-bold text-teal-700"
                      href={w.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Listing <ArrowRight className="h-4 w-4" />
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Sources */}
        <section
          id="sources"
          className="mt-14 scroll-mt-24 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8"
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
            About — how this list is made
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">
            <p>
              This portal is a dated snapshot, last scanned {LAST_SCANNED}. It does not fetch live listings when you
              open it — it is refreshed by a daily scan of Unstop, Devfolio, Hack2Skill, MLH (public listings only),
              Devpost and HackerEarth. Unstop / Devfolio / Hack2Skill are login- or JS-protected, so their new listings
              come from the daily scan, not from the automatic GitHub Action (see README and docs/ARCHITECTURE.md).
            </p>
            <p>
              <strong className="text-neutral-900">What &ldquo;Verified&rdquo; means:</strong> the date, fee, prize and
              deadline were checked against the organiser&apos;s own page. &ldquo;Unverified&rdquo; means the entry came
              from an aggregator listing and its details have not been confirmed — treat its deadline as a lead, not a
              fact. Event images: 18 cards use the organiser&apos;s official banner (stored in{" "}
              <code>public/banners/</code>); all other cards use a category illustration, labelled on the card — see{" "}
              <code>docs/BANNERS.md</code>. No banner URL was invented.
            </p>
            <p>
              Built by Pranav Shinde · Open source (MIT) ·{" "}
              <a
                className="font-bold text-teal-700"
                href="https://github.com/Iampranav009"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/Iampranav009
              </a>
            </p>
          </div>
        </section>

        <SiteFooter />
      </main>

      <MobileNav current="home" />
    </div>
  );
}
