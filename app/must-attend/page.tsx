"use client";

import { useMemo, useState } from "react";
import {
  LAST_SCANNED,
  isClosingSoon,
  isFreeEvent,
  isPaidEvent,
  mustAttendCommunity,
  mustAttendHackathons,
  type PortalEvent,
} from "../../lib/events";
import { EventCard } from "../components/EventCard";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/must-attend", label: "Must Attend" },
  { href: "/#events", label: "Events" },
  { href: "/#community", label: "Community" },
  { href: "/#planner", label: "Planner" },
  { href: "/#sources", label: "Sources" },
];

type FeeFilter = "" | "free" | "paid";
type TypeFilter = "" | "hackathons" | "community";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-bold ${
        active
          ? "border-teal-700 bg-teal-700 text-white"
          : "border-stone-300 bg-white text-stone-700 hover:border-teal-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function MustAttend() {
  const [fee, setFee] = useState<FeeFilter>("");
  const [type, setType] = useState<TypeFilter>("");

  // All must-attend events, no filter pre-selected. Filters combine:
  // Free + Hackathons shows only free hackathons, etc.
  const all: { e: PortalEvent; kind: "Hackathon" | "Community" }[] = useMemo(
    () => [
      ...mustAttendHackathons.map((e) => ({ e, kind: "Hackathon" as const })),
      ...mustAttendCommunity.map((e) => ({ e, kind: "Community" as const })),
    ],
    []
  );

  const filtered = useMemo(
    () =>
      all.filter(({ e, kind }) => {
        if (fee === "free" && !isFreeEvent(e)) return false;
        if (fee === "paid" && !isPaidEvent(e)) return false;
        if (type === "hackathons" && kind !== "Hackathon") return false;
        if (type === "community" && kind !== "Community") return false;
        return true;
      }),
    [all, fee, type]
  );

  const closingSoon = useMemo(() => all.filter(({ e }) => isClosingSoon(e)), [all]);
  const closingSoonHackathons = closingSoon.filter(({ kind }) => kind === "Hackathon").length;
  // Community events carry no deadline field in the data (all null), so
  // isClosingSoon() cannot count them — that 0 is a data gap, not "none soon".
  const closingSoonCommunity = closingSoon.filter(({ kind }) => kind === "Community").length;

  return (
    <div className="min-h-screen bg-stone-100 pb-20 text-stone-900 md:pb-0 dark:bg-stone-950 dark:text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-lg font-extrabold text-white">⌘</span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight">Hackathon Portal</span>
              <span className="block text-[11px] font-medium text-stone-500">For engineering students · India</span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                aria-current={n.href === "/must-attend" ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  n.href === "/must-attend"
                    ? "bg-teal-700 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <span className="hidden rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800 sm:block dark:bg-green-900 dark:text-green-200">
            ● Updated {LAST_SCANNED}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-teal-700 to-stone-900 p-6 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-200">⭐ Shortlisted for Pranav — not every event, only the ones worth it</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Must Attend</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-teal-100 sm:text-lg">
            The events a 3rd-year BE CSE student from Yavatmal, building with Next.js / React / TypeScript / Python and AI / GenAI agents,
            should actually register for or visit — instead of scrolling through all 400+ listings.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{all.length} must-attend events</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{mustAttendHackathons.length} hackathons</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{mustAttendCommunity.length} community events</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{closingSoon.length} closing soon</span>
          </div>
        </section>

        {/* Criteria */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <h2 className="font-bold">How an event gets on this page</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            Every event here passes all three checks in <code>lib/events.ts</code> (<code>isMustAttend</code>). Nothing is hand-picked, and nothing is invented.
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            <li><strong>Open only</strong> — status is &ldquo;open&rdquo;. Closed, unconfirmed and ended events never appear, even if they look like a perfect fit.</li>
            <li>
              <strong>Relevant to his stack</strong> — marked Best fit, <em>or</em> its category / tags mention AI / GenAI / agents / ML <em>and</em> its fee is free or low-cost (free, or ₹600 or less).
            </li>
            <li>
              <strong>Reachable</strong> — online, or in Bengaluru, Pune, Mumbai, Delhi, Chennai, Nagpur, Amravati or Yavatmal.
            </li>
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            Caveats, kept honest: a null fee counts as &ldquo;unknown&rdquo;, not free, so an AI event with no fee recorded can only qualify via Best fit.
            An event whose city was never recorded (e.g. a hybrid event with no venue in the listing) cannot qualify on location either.
            Community events carry no deadline field in the data, so the &ldquo;closing soon&rdquo; count below is hackathons only — check each community event&apos;s own page for its date.
          </p>
        </section>

        {/* Filters */}
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Must-attend events</h2>
              <p className="mt-1 text-sm text-stone-500">
                All {all.length} shown by default — no filter is pre-selected. Tap a chip to narrow down; Free and Hackathons (or any other pair) combine.
              </p>
            </div>
            <span className="text-sm font-semibold text-stone-500">Showing {filtered.length} of {all.length}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Must-attend filters">
            <FilterChip active={fee === "" && type === ""} onClick={() => { setFee(""); setType(""); }}>
              All ({all.length})
            </FilterChip>
            <FilterChip active={fee === "free"} onClick={() => setFee(fee === "free" ? "" : "free")}>
              Free
            </FilterChip>
            <FilterChip active={fee === "paid"} onClick={() => setFee(fee === "paid" ? "" : "paid")}>
              Paid
            </FilterChip>
            <FilterChip active={type === "hackathons"} onClick={() => setType(type === "hackathons" ? "" : "hackathons")}>
              Hackathons ({mustAttendHackathons.length})
            </FilterChip>
            <FilterChip active={type === "community"} onClick={() => setType(type === "community" ? "" : "community")}>
              Community Events ({mustAttendCommunity.length})
            </FilterChip>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Closing soon among these: {closingSoonHackathons} hackathons
            {closingSoonCommunity > 0 ? `, ${closingSoonCommunity} community events` : " (community events have no deadline in the data, so they are not counted here)"}.
            Free = fee starts with &ldquo;Free&rdquo;; Paid = a stated paid fee. Events with an unknown fee appear under All only.
          </p>
        </section>

        {/* Cards */}
        <section className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ e, kind }) => (
              <EventCard key={`${kind}-${e.id}`} e={e} typeLabel={kind} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="mt-6 rounded-2xl border bg-white p-6 text-center text-stone-500 dark:bg-stone-900">
              No must-attend events match those filters. Tap All to see the full shortlist again.
            </p>
          )}
        </section>

        <footer className="mt-12 border-t border-stone-200 pt-5 pb-6 text-center text-xs text-stone-500 dark:border-stone-800">
          Must Attend · rule in lib/events.ts (isMustAttend) · Last scanned {LAST_SCANNED} · Pick it here. Apply yourself.
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/95">
        <div className="grid grid-cols-6 text-center text-[11px] font-bold">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`py-3 ${n.href === "/must-attend" ? "text-teal-700 dark:text-teal-300" : "text-stone-600 dark:text-stone-300"}`}
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
