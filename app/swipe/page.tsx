"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Calendar,
  Check,
  Clock,
  Heart,
  Home,
  MapPin,
  Share2,
  Star,
  Ticket,
  Trophy,
  Undo2,
  X,
} from "lucide-react";
import { communityEvents, hackathonEvents, isClosingSoon, isFreeEvent, isMustAttend, type PortalEvent } from "../../lib/events";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Toggle } from "../../components/ui/toggle";

// localStorage keys — saved / applied / skipped survive a reload.
const LS_SAVED = "hackathon-portal-saved";
const LS_APPLIED = "hackathon-portal-applied";
const LS_SKIPPED = "hackathon-portal-skipped";

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

export default function Swipe() {
  const [mounted, setMounted] = useState(false);
  const [deckType, setDeckType] = useState<DeckType>("hackathons");
  const [mustOnly, setMustOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
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

  const visible = useMemo(() => {
    return deck.filter((e) => {
      if (mustOnly && !isMustAttend(e)) return false;
      if (freeOnly && !isFreeEvent(e)) return false;
      if (!showSaved && saved.includes(e.id)) return false;
      if (!showApplied && applied.includes(e.id)) return false;
      if (skipped.includes(e.id)) return false;
      return true;
    });
  }, [deck, mustOnly, freeOnly, saved, applied, skipped, showSaved, showApplied]);

  const current = visible[0] ?? null;
  const next = visible[1] ?? null;

  const decide = (action: Action, e: PortalEvent) => {
    if (action === "save") setSaved((s) => (s.includes(e.id) ? s : [...s, e.id]));
    if (action === "skip") setSkipped((s) => (s.includes(e.id) ? s : [...s, e.id]));
    if (action === "apply" || action === "applied") setApplied((s) => (s.includes(e.id) ? s : [...s, e.id]));
    setHistory((h) => [...h, { id: e.id, action }]);
    setDrag({ x: 0, y: 0, active: false });
  };

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
    if (last.action === "apply" || last.action === "applied") setApplied((s) => s.filter((id) => id !== last.id));
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
  const overlay = drag.x > 40 ? "save" : drag.x < -40 ? "skip" : drag.y < -40 ? "apply" : null;
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

  const savedView = showSaved && !showApplied;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-neutral-900">
      {/* Desktop header only — mobile gets no header, just the toggle below. */}
      <header className="hidden border-b border-neutral-200 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="/" className="text-base font-bold tracking-tight">
            Hackathon Portal
          </a>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            <a href="/" className="rounded-full px-3 py-2 text-neutral-600 hover:bg-neutral-100">Home</a>
            <a href="/must-attend" className="rounded-full px-3 py-2 text-neutral-600 hover:bg-neutral-100">Must Attend</a>
            <a href="/swipe" aria-current="page" className="rounded-full bg-teal-700 px-3 py-2 text-white">Swipe</a>
          </nav>
        </div>
      </header>

      {/* Top: ONLY the Hackathons / Community Events toggle */}
      <div className="shrink-0 px-4 pt-3">
        <div className="mx-auto flex w-fit rounded-full bg-neutral-100 p-1" role="group" aria-label="Deck type">
          <Button
            variant={deckType === "hackathons" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDeckType("hackathons")}
            aria-pressed={deckType === "hackathons"}
            className="rounded-full"
          >
            Hackathons
          </Button>
          <Button
            variant={deckType === "community" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDeckType("community")}
            aria-pressed={deckType === "community"}
            className="rounded-full"
          >
            Community Events
          </Button>
        </div>
      </div>

      {/* One compact filter row — no counters, no explanatory text */}
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto px-4 pt-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Toggle pressed={mustOnly} onPressedChange={setMustOnly} aria-label="Must Attend only">
          <Star className="h-3.5 w-3.5" /> Must Attend
        </Toggle>
        <Toggle pressed={freeOnly} onPressedChange={setFreeOnly} aria-label="Free only">
          <Ticket className="h-3.5 w-3.5" /> Free only
        </Toggle>
        <Toggle pressed={showSaved} onPressedChange={(v) => { setShowSaved(v); if (v) setShowApplied(false); }} aria-label="Show saved">
          <Bookmark className="h-3.5 w-3.5" /> Saved
        </Toggle>
        <Toggle pressed={showApplied} onPressedChange={(v) => { setShowApplied(v); if (v) setShowSaved(false); }} aria-label="Show applied">
          <Check className="h-3.5 w-3.5" /> Applied
        </Toggle>
        <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0} aria-label="Undo last swipe" className="ml-auto h-8 w-8 shrink-0 rounded-full">
          <Undo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Deck — fills the remaining viewport */}
      <main className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pb-3 pt-1" aria-label="Swipe deck">
        {!mounted ? (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-neutral-200 text-sm text-neutral-500">Loading deck…</div>
        ) : !current ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-neutral-200 p-8 text-center">
            <h2 className="text-xl font-bold">That&apos;s the whole deck</h2>
            <p className="mt-2 text-sm text-neutral-500">No more cards in this view right now.</p>
            <Button asChild className="mt-6">
              <a href="/#events">Back to all events</a>
            </Button>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => { setSkipped([]); showToast("Skipped cards are back in the deck"); }}
            >
              Reset skipped cards
            </Button>
          </div>
        ) : (
          <>
            {next && (
              <div className="pointer-events-none absolute inset-x-4 top-0 hidden" aria-hidden="true" />
            )}
            <div
              className="relative min-h-0 flex-1 touch-none select-none"
              style={cardStyle}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => setDrag({ x: 0, y: 0, active: false })}
            >
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="relative h-44 w-full shrink-0 overflow-hidden bg-neutral-100">
                  {current.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={current.banner}
                      alt={current.bannerSource === "official" ? `Official banner for ${current.title}` : `Category illustration for ${current.title}`}
                      draggable={false}
                      className={`h-full w-full ${current.bannerFit === "contain" ? "object-contain p-6" : "object-cover"}`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-6 text-center">
                      <span className="text-xl font-bold">{current.title}</span>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <Badge variant="dark">{current.category}</Badge>
                    {isMustAttend(current) && <Badge>Must Attend</Badge>}
                    {isClosingSoon(current) && <Badge variant="dark">Closing soon</Badge>}
                  </div>
                  {current.status === "unconfirmed" && (
                    <Badge variant="outline" className="absolute right-3 top-3">Unconfirmed</Badge>
                  )}
                  {overlay === "save" && (
                    <span className="absolute left-4 top-16 rotate-[-12deg] rounded-lg border-4 border-teal-700 px-3 py-1 text-2xl font-bold uppercase tracking-widest text-teal-700">Save</span>
                  )}
                  {overlay === "skip" && (
                    <span className="absolute right-4 top-16 rotate-[12deg] rounded-lg border-4 border-neutral-900 px-3 py-1 text-2xl font-bold uppercase tracking-widest text-neutral-900">Skip</span>
                  )}
                  {overlay === "apply" && (
                    <span className="absolute left-1/2 top-16 -translate-x-1/2 rounded-lg border-4 border-teal-700 px-3 py-1 text-2xl font-bold uppercase tracking-widest text-teal-700">Apply</span>
                  )}
                </div>

                <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pr-16">
                  <h2 className="text-xl font-bold leading-tight">{current.title}</h2>

                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0 text-neutral-400" /><span className="truncate">{current.dates || "Dates TBA"}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-neutral-400" /><span className="truncate">{current.city || current.mode || "—"}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-neutral-400" /><span className="truncate font-semibold text-teal-700">{current.deadline || "TBA"}</span></div>
                    <div className="flex items-center gap-2"><Ticket className="h-4 w-4 shrink-0 text-neutral-400" /><span className="truncate">{current.fee || "Fee TBA"}</span></div>
                    {current.prize && (
                      <div className="col-span-2 flex items-center gap-2"><Trophy className="h-4 w-4 shrink-0 text-neutral-400" /><span className="truncate font-bold">{current.prize}</span></div>
                    )}
                  </dl>

                  {current.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">{current.description}</p>
                  )}
                  {current.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {current.tags.map((t) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  )}
                  {current.notes && (
                    <p className="mt-3 rounded-xl border border-neutral-200 p-2.5 text-xs leading-relaxed text-neutral-600">{current.notes}</p>
                  )}
                  {current.verified && <p className="mt-3 text-xs font-semibold text-teal-700">Verified listing</p>}

                  <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2" onPointerDown={(e) => e.stopPropagation()}>
                    <Button size="iconLg" onClick={() => swipe("apply")} disabled={!current.link} aria-label="Apply — opens the official page" title="Apply">
                      <ArrowUpRight className="h-5 w-5" />
                    </Button>
                    <Button size="iconLg" variant="outline" onClick={() => swipe("save")} aria-label="Save" title="Save">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button size="iconLg" variant="outline" onClick={() => swipe("applied")} aria-label="Mark as already applied" title="Already applied">
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button size="iconLg" variant="outline" onClick={() => share(current)} aria-label="Share" title="Share">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </article>
            </div>

            <div className="flex shrink-0 items-center justify-center gap-4 pt-3">
              <Button size="iconXl" variant="outline" onClick={() => swipe("skip")} aria-label="Skip" className="text-neutral-900">
                <X className="h-6 w-6" />
              </Button>
              <Button size="iconXl" onClick={() => swipe("save")} aria-label="Save" variant="dark">
                <Heart className="h-6 w-6" />
              </Button>
              <Button size="iconXl" onClick={() => swipe("apply")} disabled={!current.link} aria-label="Apply">
                <ArrowUpRight className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Mobile-only bottom nav: Home, Swipe, Must Attend, Saved */}
      <nav className="shrink-0 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Primary">
        <div className="grid grid-cols-4 text-center">
          <a href="/" className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-neutral-600">
            <Home className="h-5 w-5" /> Home
          </a>
          <a href="/swipe" aria-current="page" className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-teal-700">
            <Heart className="h-5 w-5" /> Swipe
          </a>
          <a href="/must-attend" className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-neutral-600">
            <Star className="h-5 w-5" /> Must Attend
          </a>
          <button
            onClick={() => { setShowSaved(!showSaved); setShowApplied(false); }}
            aria-pressed={savedView}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${savedView ? "text-teal-700" : "text-neutral-600"}`}
          >
            <Bookmark className="h-5 w-5" /> Saved
          </button>
        </div>
      </nav>

      {toast && (
        <p role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
          {toast}
        </p>
      )}
    </div>
  );
}
