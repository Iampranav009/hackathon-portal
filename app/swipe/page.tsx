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
  const cardRef = useRef<HTMLDivElement | null>(null);
  // Drag state lives in a ref, not React state: pointermove/up must read the
  // *latest* position, not the value captured by the render that created the
  // handler (the old code read stale `drag` state in onPointerUp, so a fast
  // flick could end below the 100px threshold and snap back).
  const dragRef = useRef({
    active: false,
    locked: "" as "" | "h" | "v" | "up",
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    lastX: 0,
    lastT: 0,
    velocityX: 0,
    pointerId: -1,
    // True when the finger started on the banner (non-scrollable part).
    // An up-drag from there is a swipe-up (Apply); an up-drag from the
    // scrollable body is just scrolling the description.
    startOnBanner: false,
  });
  const dragMoved = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deck = useMemo(() => buildDeck(deckType), [deckType]);

  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === "#saved") setShowSaved(true);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

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

  /**
   * Fingertip swipe — native Pointer Events on the card, attached with
   * addEventListener (not React onPointer* props).
   *
   * Why the old code never swiped on a phone:
   * 1. The card body is a scrollable div (overflow-y-auto). A finger
   *    starting on the text/description is a *scroll* gesture: the
   *    browser takes over the touch, fires pointercancel, and React's
   *    onPointerMove stops firing — the card never follows the finger.
   * 2. `touch-none` (touch-action: none) on the outer div did not fix
   *    it: touch-action is per-element, and the scrollable child still
   *    had the default (auto), so the browser still claimed the touch.
   * 3. setPointerCapture was called on ev.target (whatever child the
   *    finger happened to land on — an img, a span), not on the card.
   * 4. onPointerUp read the `drag` React state from its render-time
   *    closure, which can lag the last pointermove — a fast flick could
   *    read x < 100px and snap back instead of swiping.
   *
   * The fix: touch-action: pan-y on the card AND on the article AND on
   * the scrollable body (the browser intersects touch-action from the
   * touch target up to the scroll container, so pan-y on the outer div
   * alone was ignored for touches starting on the text — the scroll
   * div's `auto` won and the browser claimed the touch for scrolling,
   * firing pointercancel after the first move). With pan-y everywhere
   * in the card, the browser may scroll vertically, but horizontal
   * movement is handed to JS. The banner is touch-action: none (it has
   * nothing scrollable), so an up-drag from the banner also reaches JS
   * as swipe-up (Apply) instead of the browser claiming the vertical
   * pan and firing pointercancel. Direction lock on the first ~10px of
   */
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !current) return;
    const d = dragRef.current;

    const onDown = (ev: PointerEvent) => {
      if (!ev.isPrimary) return;
      if ((ev.target as HTMLElement).closest("button, a")) return;
      d.active = true;
      d.locked = "";
      d.startX = ev.clientX;
      d.startY = ev.clientY;
      d.x = 0;
      d.y = 0;
      d.lastX = ev.clientX;
      d.lastT = performance.now();
      d.velocityX = 0;
      d.pointerId = ev.pointerId;
      d.startOnBanner = !(ev.target as HTMLElement).closest("[data-scroll]");
      dragMoved.current = false;
    };

    const onMove = (ev: PointerEvent) => {
      if (!d.active || ev.pointerId !== d.pointerId) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      if (!d.locked) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        // Direction lock: horizontal wins the gesture; vertical from the
        // banner is swipe-up (Apply); vertical from the scrollable body
        // is just scrolling the description.
        d.locked =
          Math.abs(dx) > Math.abs(dy) ? "h" : d.startOnBanner && dy < 0 ? "up" : "v";
        if (d.locked === "v") {
          // Vertical: release the drag so the card body can scroll.
          d.active = false;
          return;
        }
        // Horizontal: capture the pointer on the CARD (not the child
        // the finger landed on) so moves keep arriving even if the
        // finger slides off the card.
        try {
          el.setPointerCapture(ev.pointerId);
        } catch {
          // Already released / not capturable — moves still arrive
          // while the finger stays over the card.
        }
        setDrag({ x: 0, y: 0, active: true });
      }
      if (d.locked !== "h" && d.locked !== "up") return;
      // Stop the browser from scrolling sideways once we own the gesture.
      ev.preventDefault();
      const now = performance.now();
      const dt = now - d.lastT;
      if (dt > 0) d.velocityX = (ev.clientX - d.lastX) / dt;
      d.lastX = ev.clientX;
      d.lastT = now;
      d.x = dx;
      d.y = dy;
      if (Math.abs(dx) + Math.abs(dy) > 6) dragMoved.current = true;
      setDrag({ x: dx, y: dy, active: true });
    };

    const finish = (ev: PointerEvent) => {
      if (!d.active || ev.pointerId !== d.pointerId) return;
      d.active = false;
      if (d.locked !== "h" && d.locked !== "up") {
        setDrag({ x: 0, y: 0, active: false });
        return;
      }
      const { x, y } = d;
      const width = el.offsetWidth || 320;
      // Complete the swipe at 80px, or 25% of the card width, or on a
      // fast flick (velocity > 0.5 px/ms) — a short sharp flick counts.
      const threshold = Math.min(80, width * 0.25);
      const fling = Math.abs(d.velocityX) > 0.5;
      if (x > threshold || (fling && d.velocityX > 0)) swipe("save"); // right = select/save
      else if (x < -threshold || (fling && d.velocityX < 0)) swipe("skip"); // left = reject/skip
      else if (y < -threshold && Math.abs(y) > Math.abs(x)) swipe("apply"); // up = apply
      else setDrag({ x: 0, y: 0, active: false });
    };

    const onCancel = () => {
      d.active = false;
      d.locked = "";
      setDrag({ x: 0, y: 0, active: false });
    };

    // { passive: false } so preventDefault() in onMove actually works.
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove, { passive: false });
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", onCancel);
    // Re-attach when the card mounts or changes: on first render `current`
    // exists but the card is still in its "Loading deck…" state, so
    // cardRef.current is null — without `mounted` in the deps the
    // listeners would never be attached at all (that is what the
    // headless touch test caught).
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", onCancel);
    };
  }, [current, mounted]);

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
            <div
              ref={cardRef}
              className="relative min-h-0 flex-1 select-none [touch-action:pan-y]"
              style={cardStyle}
            >
              <article className="flex h-full touch-pan-y flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="relative h-44 w-full shrink-0 touch-none overflow-hidden bg-neutral-100">
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

                <div data-scroll className="relative flex min-h-0 flex-1 touch-pan-y flex-col overflow-y-auto p-4 pr-16">
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
                  {current.verified ? (
                    <p className="mt-3 text-xs font-semibold text-teal-700">Verified listing</p>
                  ) : (
                    <p className="mt-3 text-xs font-semibold text-neutral-500">Unverified — check the organiser page</p>
                  )}

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

      {/* No bottom navigation on Swipe — full-screen deck, like Tinder. */}

      {toast && (
        <p role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
          {toast}
        </p>
      )}
    </div>
  );
}
