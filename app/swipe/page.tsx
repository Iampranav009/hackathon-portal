"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LAST_SCANNED,
  communityEvents,
  hackathonEvents,
  isClosingSoon,
  isFreeEvent,
  isMustAttend,
  type PortalEvent,
} from "../../lib/events";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/must-attend", label: "Must Attend" },
  { href: "/swipe", label: "Swipe" },
  { href: "/#events", label: "Events" },
  { href: "/#community", label: "Community" },
  { href: "/#planner", label: "Planner" },
  { href: "/#sources", label: "Sources" },
];

// localStorage keys — saved / applied / skipped survive a reload.
const LS_SAVED = "hackathon-portal-saved";
const LS_APPLIED = "hackathon-portal-applied";
const LS_SKIPPED = "hackathon-portal-skipped";

type DeckFilter = "all" | "must" | "free";
type DeckType = "hackathons" | "community";
type Action = "save" | "skip" | "apply" | "applied";

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Private mode / full storage: deck still works for this session.
  }
}

/** Best-effort parse of the free-text deadline ("Apply by 27 Nov 2026", "~30 Dec 2026", …). */
function deadlineTime(e: PortalEvent): number {
  if (!e.deadline) return Number.POSITIVE_INFINITY;
  const m = e.deadline.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(2026|2027)/i);
  if (!m) return Number.POSITIVE_INFINITY;
  const t = Date.parse(`${m[2]} ${m[1]}, ${m[3]}`);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** Deck order: open events only, Must Attend first, then by deadline (soonest first). */
function buildDeck(kind: DeckType): PortalEvent[] {
  const source = kind === "hackathons" ? hackathonEvents : communityEvents;
  const open = source.filter((e) => e.status === "open");
  const must = open.filter(isMustAttend).sort((a, b) => deadlineTime(a) - deadlineTime(b));
  const rest = open.filter((e) => !isMustAttend(e)).sort((a, b) => deadlineTime(a) - deadlineTime(b));
  return [...must, ...rest];
}

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

export default function Swipe() {
  const [mounted, setMounted] = useState(false);
  const [deckType, setDeckType] = useState<DeckType>("hackathons");
  const [filter, setFilter] = useState<DeckFilter>("all");
  const [showSaved, setShowSaved] = useState(false);
  const [showApplied, setShowApplied] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [history, setHistory] = useState<{ id: string; action: Action }[]>([]);
  const [toast, setToast] = useState("");
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<"" | "left" | "right" | "up">("");
  const dragStart = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deck = useMemo(() => buildDeck(deckType), [deckType]);

  // Load persisted state once (after mount, so SSR and the first paint agree).
  useEffect(() => {
    setSaved(readIds(LS_SAVED));
    setApplied(readIds(LS_APPLIED));
    setSkipped(readIds(LS_SKIPPED));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) writeIds(LS_SAVED, saved);
  }, [saved, mounted]);
  useEffect(() => {
    if (mounted) writeIds(LS_APPLIED, applied);
  }, [applied, mounted]);
  useEffect(() => {
    if (mounted) writeIds(LS_SKIPPED, skipped);
  }, [skipped, mounted]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  // The deck, after the top filter and after hiding decided cards.
  const visible = useMemo(() => {
    return deck.filter((e) => {
      if (filter === "must" && !isMustAttend(e)) return false;
      if (filter === "free" && !isFreeEvent(e)) return false;
      if (!showSaved && saved.includes(e.id)) return false;
      if (!showApplied && applied.includes(e.id)) return false;
      if (skipped.includes(e.id)) return false;
      return true;
    });
  }, [deck, filter, saved, applied, skipped, showSaved, showApplied]);

  const current = visible[0] ?? null;
  const next = visible[1] ?? null;

  /** Record a decision and move to the next card. */
  const decide = (action: Action, e: PortalEvent) => {
    if (action === "save") setSaved((s) => (s.includes(e.id) ? s : [...s, e.id]));
    if (action === "skip") setSkipped((s) => (s.includes(e.id) ? s : [...s, e.id]));
    if (action === "apply" || action === "applied")
      setApplied((s) => (s.includes(e.id) ? s : [...s, e.id]));
    setHistory((h) => [...h, { id: e.id, action }]);
    setDrag({ x: 0, y: 0, active: false });
  };

  /** Fly the card off in a direction, then record the decision. */
  const swipe = (action: Action) => {
    if (!current) return;
    const dir = action === "save" ? "right" : action === "skip" ? "left" : "up";
    setLeaving(dir);
    const e = current;
    if (action === "apply" && e.link) window.open(e.link, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      decide(action, e);
      setLeaving("");
    }, 220);
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    if (last.action === "save") setSaved((s) => s.filter((id) => id !== last.id));
    if (last.action === "skip") setSkipped((s) => s.filter((id) => id !== last.id));
    if (last.action === "apply" || last.action === "applied")
      setApplied((s) => s.filter((id) => id !== last.id));
    setHistory((h) => h.slice(0, -1));
    showToast("Undone — card is back in the deck");
  };

  const share = async (e: PortalEvent) => {
    const url = e.link || window.location.href;
    const text = `${e.title} — ${e.dates || ""} · ${e.city || e.mode || ""}`.trim();
    try {
      if (navigator.share) {
        await navigator.share({ title: e.title, text, url });
        return;
      }
      throw new Error("no share sheet");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied — paste it anywhere to share");
      } catch {
        showToast("Copy failed — long-press the Apply link instead");
      }
    }
  };

  // --- Drag handling (touch + mouse, via pointer events) ---
  const onPointerDown = (ev: React.PointerEvent) => {
    if (!current) return;
    dragStart.current = { x: ev.clientX, y: ev.clientY };
    dragMoved.current = false;
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    if (!drag.active || !current) return;
    const dx = ev.clientX - dragStart.current.x;
    const dy = ev.clientY - dragStart.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) dragMoved.current = true;
    setDrag({ x: dx, y: dy, active: true });
  };
  const onPointerUp = () => {
    if (!drag.active || !current) return;
    const { x, y } = drag;
    if (x > 100) swipe("save");
    else if (x < -100) swipe("skip");
    else if (y < -100) swipe("apply");
    else setDrag({ x: 0, y: 0, active: false });
  };

  const rotation = drag.x / 18;
  const overlay =
    drag.x > 40 ? "save" : drag.x < -40 ? "skip" : drag.y < -40 ? "apply" : null;
  const cardStyle: React.CSSProperties =
    leaving === "right"
      ? { transform: "translate(120vw, 20px) rotate(24deg)", transition: "transform 0.22s ease-in", opacity: 0 }
      : leaving === "left"
        ? { transform: "translate(-120vw, 20px) rotate(-24deg)", transition: "transform 0.22s ease-in", opacity: 0 }
        : leaving === "up"
          ? { transform: "translate(0, -110vh) rotate(0deg)", transition: "transform 0.22s ease-in", opacity: 0 }
          : drag.active
            ? { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)` }
            : { transform: "translate(0, 0) rotate(0deg)", transition: "transform 0.18s ease-out" };

  const mustCount = deck.filter(isMustAttend).length;
  const freeCount = deck.filter(isFreeEvent).length;

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 pb-20 text-stone-900 md:pb-0 dark:bg-stone-950 dark:text-stone-100">
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
                aria-current={n.href === "/swipe" ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  n.href === "/swipe"
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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5">
        {/* Title + filter */}
        <section className="mt-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Swipe hackathons</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-500">
            One event, one card, full overview. Swipe right to save, left to skip, up to apply.
            Must Attend comes first, then the rest by deadline. Nothing is submitted for you —
            Apply only opens the official page in a new tab.
          </p>
          {/* Type toggle — Hackathons (default) / Community Events */}
          <div className="mx-auto mt-4 flex w-fit rounded-full border border-stone-300 bg-white p-1 dark:border-stone-700 dark:bg-stone-900" role="group" aria-label="Deck type">
            <button
              onClick={() => setDeckType("hackathons")}
              aria-pressed={deckType === "hackathons"}
              className={`rounded-full px-5 py-2 text-sm font-bold ${deckType === "hackathons" ? "bg-teal-700 text-white" : "text-stone-600 dark:text-stone-300"}`}
            >
              Hackathons
            </button>
            <button
              onClick={() => setDeckType("community")}
              aria-pressed={deckType === "community"}
              className={`rounded-full px-5 py-2 text-sm font-bold ${deckType === "community" ? "bg-teal-700 text-white" : "text-stone-600 dark:text-stone-300"}`}
            >
              Community Events
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Deck filter">
            <button
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
              className={`rounded-full border px-4 py-2 text-sm font-bold ${filter === "all" ? "border-teal-700 bg-teal-700 text-white" : "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"}`}
            >
              All ({deck.length})
            </button>
            <button
              onClick={() => setFilter("must")}
              aria-pressed={filter === "must"}
              className={`rounded-full border px-4 py-2 text-sm font-bold ${filter === "must" ? "border-teal-700 bg-teal-700 text-white" : "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"}`}
            >
              ⭐ Must Attend ({mustCount})
            </button>
            <button
              onClick={() => setFilter("free")}
              aria-pressed={filter === "free"}
              className={`rounded-full border px-4 py-2 text-sm font-bold ${filter === "free" ? "border-teal-700 bg-teal-700 text-white" : "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"}`}
            >
              Free only ({freeCount})
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setShowSaved(!showSaved)}
              aria-pressed={showSaved}
              className={`rounded-full border px-3 py-1.5 ${showSaved ? "border-amber-500 bg-amber-400 text-amber-950" : "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"}`}
            >
              ♥ Saved ({saved.length}) {showSaved ? "· showing" : "· hidden"}
            </button>
            <button
              onClick={() => setShowApplied(!showApplied)}
              aria-pressed={showApplied}
              className={`rounded-full border px-3 py-1.5 ${showApplied ? "border-green-600 bg-green-600 text-white" : "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"}`}
            >
              ✓ Applied ({applied.length}) {showApplied ? "· showing" : "· hidden"}
            </button>
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900"
            >
              ↩ Undo last swipe
            </button>
          </div>
          <p className="mt-3 text-sm font-bold text-stone-600 dark:text-stone-300">
            {mounted && current
              ? `${deck.length - visible.length + 1} of ${deck.length} open ${deckType === "hackathons" ? "hackathons" : "community events"}`
              : mounted
                ? "Deck finished"
                : "Loading deck…"}
          </p>
        </section>

        {/* Deck */}
        <section className="relative mx-auto mt-4 w-full max-w-md flex-1" aria-label="Hackathon swipe deck">
          {!mounted ? (
            <div className="flex h-[560px] items-center justify-center rounded-3xl border border-stone-200 bg-white text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900">
              Loading deck…
            </div>
          ) : !current ? (
            <div className="flex h-[560px] flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-stone-900">
              <p className="text-5xl">🎉</p>
              <h2 className="mt-4 text-2xl font-extrabold">That&apos;s the whole deck</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                You&apos;ve gone through every open {deckType === "hackathons" ? "hackathon" : "community event"} in this filter. Saved ({saved.length}) and
                applied ({applied.length}) events are kept out of the deck — turn &ldquo;Saved&rdquo; or
                &ldquo;Applied&rdquo; on above to see them again.
              </p>
              <a href="/#events" className="mt-6 rounded-2xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800">
                Back to all events →
              </a>
              <button
                onClick={() => {
                  setSkipped([]);
                  showToast("Skipped cards are back in the deck");
                }}
                className="mt-3 rounded-2xl border border-stone-300 px-5 py-3 text-sm font-bold dark:border-stone-700"
              >
                Reset skipped cards
              </button>
            </div>
          ) : (
            <>
              {/* Next card peeking underneath */}
              {next && (
                <div className="pointer-events-none absolute inset-x-0 top-0 scale-[0.96] opacity-60">
                  <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex h-[560px] items-center justify-center p-6 text-center text-lg font-bold text-stone-400">
                      {next.title}
                    </div>
                  </div>
                </div>
              )}

              {/* Top card */}
              <div
                className="relative touch-none select-none"
                style={cardStyle}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setDrag({ x: 0, y: 0, active: false })}
              >
                <article className="flex h-[560px] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900">
                  {/* Cover */}
                  <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-stone-900">
                    {current.banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={current.banner}
                        alt={current.bannerSource === "official" ? `Official banner for ${current.title}` : `Category illustration for ${current.title}`}
                        draggable={false}
                        className={`h-full w-full ${current.bannerFit === "contain" ? "object-contain p-6" : "object-cover"}`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-600 via-indigo-600 to-stone-900 p-6 text-center">
                        <span className="text-2xl font-extrabold text-white">{current.title}</span>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
                        {current.category}
                      </span>
                      {isMustAttend(current) && (
                        <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950">
                          ⭐ Must Attend
                        </span>
                      )}
                      {isClosingSoon(current) && (
                        <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                          Closing soon
                        </span>
                      )}
                    </div>
                    {current.status === "unconfirmed" && (
                      <span className="absolute right-3 top-3 rounded-full bg-yellow-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-yellow-950">
                        Unconfirmed
                      </span>
                    )}
                    {/* Drag overlays */}
                    {overlay === "save" && (
                      <span className="absolute left-4 top-16 rotate-[-12deg] rounded-lg border-4 border-green-500 px-3 py-1 text-2xl font-extrabold uppercase tracking-widest text-green-500">
                        Save
                      </span>
                    )}
                    {overlay === "skip" && (
                      <span className="absolute right-4 top-16 rotate-[12deg] rounded-lg border-4 border-red-500 px-3 py-1 text-2xl font-extrabold uppercase tracking-widest text-red-500">
                        Skip
                      </span>
                    )}
                    {overlay === "apply" && (
                      <span className="absolute left-1/2 top-16 -translate-x-1/2 rounded-lg border-4 border-teal-600 px-3 py-1 text-2xl font-extrabold uppercase tracking-widest text-teal-600">
                        Apply
                      </span>
                    )}
                  </div>

                  {/* Body + right action rail */}
                  <div className="relative flex flex-1 flex-col overflow-y-auto p-5 pr-20">
                    <h2 className="text-2xl font-extrabold leading-tight">{current.title}</h2>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Chip>📅 {current.dates || "Dates TBA"}</Chip>
                      {current.mode && <Chip tone="teal">{current.mode === "online" ? "🌐 Online" : current.mode === "hybrid" ? "Hybrid" : "📍 Offline"}</Chip>}
                      {current.city && <Chip>📍 {current.city}</Chip>}
                      {current.fee && <Chip tone="green">{current.fee}</Chip>}
                    </div>
                    {current.prize && (
                      <p className="mt-3 text-lg font-extrabold">🏆 {current.prize} <span className="text-xs font-medium text-stone-500">prize</span></p>
                    )}
                    {current.description && (
                      <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{current.description}</p>
                    )}
                    {current.teams && <p className="mt-2 text-xs text-stone-500">{current.teams}</p>}
                    {current.notes && (
                      <p className="mt-3 rounded-lg bg-yellow-50 p-2.5 text-xs leading-relaxed text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
                        ⚠ {current.notes}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
                      <div className="text-sm">
                        <span className="block text-[11px] font-semibold uppercase tracking-wide text-stone-400">Deadline</span>
                        <span className="font-bold text-amber-700 dark:text-amber-300">{current.deadline || "TBA"}</span>
                      </div>
                      {current.verified && <Chip tone="green">✓ Verified</Chip>}
                    </div>
                    {current.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {current.tags.map((t) => (
                          <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {current.source && <p className="mt-2 text-[11px] text-stone-400">Source: {current.source}</p>}
                    <p className="mt-3 text-center text-[11px] font-semibold text-stone-400">Drag the card — or use the buttons below</p>

                    {/* Right-side vertical action rail (Tinder-style) */}
                    <div
                      className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2.5"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => swipe("apply")}
                        disabled={!current.link}
                        title="Apply — opens the official page"
                        aria-label="Apply — opens the official page"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-lg font-extrabold text-white shadow-lg hover:bg-teal-800 disabled:opacity-40"
                      >
                        ↗
                      </button>
                      <button
                        onClick={() => swipe("save")}
                        title="Save this hackathon"
                        aria-label="Save this hackathon"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-extrabold text-amber-950 shadow-lg hover:bg-amber-300"
                      >
                        ♥
                      </button>
                      <button
                        onClick={() => swipe("applied")}
                        title="Mark as already applied"
                        aria-label="Mark as already applied"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-lg font-extrabold text-white shadow-lg hover:bg-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => share(current)}
                        title="Share this hackathon"
                        aria-label="Share this hackathon"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-extrabold text-stone-700 shadow-lg ring-1 ring-stone-300 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700"
                      >
                        ⤴
                      </button>
                    </div>
                  </div>
                </article>
              </div>

              {/* Bottom action buttons (same actions, no drag needed) */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => swipe("skip")}
                  aria-label="Skip"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-extrabold text-red-500 shadow-lg ring-1 ring-stone-200 hover:scale-105 dark:bg-stone-900 dark:ring-stone-700"
                >
                  ✕
                </button>
                <button
                  onClick={() => swipe("save")}
                  aria-label="Save"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-3xl font-extrabold text-amber-950 shadow-lg hover:scale-105"
                >
                  ♥
                </button>
                <button
                  onClick={() => swipe("apply")}
                  disabled={!current.link}
                  aria-label="Apply"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-2xl font-extrabold text-white shadow-lg hover:scale-105 disabled:opacity-40"
                >
                  ↗
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-stone-500">
                ← Skip &nbsp;·&nbsp; Save → &nbsp;·&nbsp; ↑ Apply &nbsp;·&nbsp; {current.link ? "Apply opens the official page — nothing is submitted for you." : "No official link on file for this one, so Apply is off."}
              </p>
            </>
          )}
        </section>

        {/* Keyboard hint + saved/applied quick view */}
        <section className="mx-auto mt-6 w-full max-w-md pb-6 text-center text-xs leading-relaxed text-stone-500">
          <p>
            Saved and applied events stay on this device (localStorage) and are hidden from the deck until
            you turn them back on. Swiping is a shortcut for the same buttons — it never applies for you.
          </p>
          {toast && (
            <p role="status" className="mt-3 rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-stone-900">
              {toast}
            </p>
          )}
        </section>

        <footer className="border-t border-stone-200 pt-5 pb-6 text-center text-xs text-stone-500 dark:border-stone-800">
          Swipe · one card at a time · Last scanned {LAST_SCANNED} · Pick it here. Apply yourself.
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/95">
        <div className="grid grid-cols-7 text-center text-[11px] font-bold">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`py-3 ${n.href === "/swipe" ? "text-teal-700 dark:text-teal-300" : "text-stone-600 dark:text-stone-300"}`}
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
