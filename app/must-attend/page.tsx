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
import { Star } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { MobileNav, SiteFooter, SiteHeader } from "../components/SiteChrome";

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
          : "border-neutral-300 bg-white text-neutral-700 hover:border-teal-700"
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
    <div className="min-h-screen bg-neutral-100 pb-20 text-neutral-900 md:pb-0">
      <SiteHeader current="must-attend" />

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-teal-700 p-6 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-100">Shortlisted for Pranav — not every event, only the ones worth it</p>
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
        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h2 className="font-bold">How an event gets on this page</h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
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
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
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
              <p className="mt-1 text-sm text-neutral-500">
                All {all.length} shown by default — no filter is pre-selected. Tap a chip to narrow down; Free and Hackathons (or any other pair) combine.
              </p>
            </div>
            <span className="text-sm font-semibold text-neutral-500">Showing {filtered.length} of {all.length}</span>
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
          <p className="mt-3 text-xs text-neutral-500">
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
            <p className="mt-6 rounded-2xl border bg-white p-6 text-center text-neutral-500">
              No must-attend events match those filters. Tap All to see the full shortlist again.
            </p>
          )}
        </section>

        <SiteFooter />
      </main>

      <MobileNav current="must-attend" />
    </div>
  );
}
