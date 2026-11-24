"use client";

import { useState } from "react";
import { Bookmark, CalendarDays, Heart, Home, Info, Menu, Star, Users, X, Zap } from "lucide-react";
import { LAST_SCANNED } from "../../lib/events";

/**
 * Shared site chrome — one header, one mobile bottom nav, one footer for
 * Home and Must Attend, so the pages read as one product.
 * Clean minimal theme: white, near-black text, one teal accent, lucide
 * icons only (no emoji).
 *
 * Navigation split (per Pranav, 24 Nov 2026):
 * - Mobile bottom nav (all pages EXCEPT Swipe, which stays full-screen
 *   with no bottom nav): Home, Swipe, Events, Community.
 *   Events / Community are the /#events and /#community sections on Home.
 *   Sources is deliberately NOT in the bottom nav.
 * - Hamburger menu in the header (mobile): Must Attend, Planner, Sources,
 *   Saved. Desktop keeps the full nav row in the header.
 */

export type NavKey = "home" | "must-attend" | "swipe" | "events" | "community" | "planner" | "sources";

const DESKTOP_NAV: { href: string; label: string; key: NavKey }[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/must-attend", label: "Must Attend", key: "must-attend" },
  { href: "/swipe", label: "Swipe", key: "swipe" },
  { href: "/#events", label: "Events", key: "events" },
  { href: "/#community", label: "Community", key: "community" },
  { href: "/#planner", label: "Planner", key: "planner" },
  { href: "/#sources", label: "Sources", key: "sources" },
];

/** Items that live only in the hamburger menu (mobile header). */
const MENU_ITEMS: { href: string; label: string; key: NavKey; Icon: typeof Star }[] = [
  { href: "/must-attend", label: "Must Attend", key: "must-attend", Icon: Star },
  { href: "/#planner", label: "Planner", key: "planner", Icon: CalendarDays },
  { href: "/#sources", label: "Sources", key: "sources", Icon: Info },
  { href: "/swipe#saved", label: "Saved", key: "swipe", Icon: Bookmark },
];

export function SiteHeader({ current }: { current?: NavKey }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Zap className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-neutral-900">Hackathon Portal</span>
            <span className="block text-[11px] font-medium text-neutral-500">For engineering students · India</span>
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {DESKTOP_NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              aria-current={current === n.key ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-sm font-semibold ${
                current === n.key
                  ? "bg-teal-700 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        {/* Last-scanned badge is visible on mobile too — it is a trust signal, not decoration. */}
        <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800">
          Updated {LAST_SCANNED}
        </span>
        {/* Hamburger menu — mobile only. Must Attend, Planner, Sources, Saved. */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menuOpen && (
        <nav className="border-t border-neutral-200 bg-white px-5 py-2 md:hidden" aria-label="More">
          {MENU_ITEMS.map(({ href, label, key, Icon }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              aria-current={current === key ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
                current === key ? "bg-teal-50 text-teal-700" : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Icon className="h-5 w-5 text-neutral-500" />
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

/**
 * Mobile-only bottom nav: exactly four items — Home, Swipe, Events,
 * Community. Shown on every page EXCEPT /swipe (the Swipe page renders
 * no MobileNav at all, so it stays full-screen).
 */
export function MobileNav({ current }: { current?: NavKey }) {
  const items = [
    { href: "/", label: "Home", key: "home" as const, Icon: Home },
    { href: "/swipe", label: "Swipe", key: "swipe" as const, Icon: Heart },
    { href: "/#events", label: "Events", key: "events" as const, Icon: CalendarDays },
    { href: "/#community", label: "Community", key: "community" as const, Icon: Users },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <div className="grid grid-cols-4 text-center">
        {items.map(({ href, label, key, Icon }) => (
          <a
            key={label}
            href={href}
            aria-current={current === key ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              current === key ? "text-teal-700" : "text-neutral-600"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-neutral-200 pt-6 pb-6 text-center">
      <p className="text-sm font-bold text-neutral-900">Pick it here. Apply yourself.</p>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-neutral-500">
        Last scanned {LAST_SCANNED} · Dated snapshot, refreshed by a daily scan — this page does not fetch live
        listings when you open it. Sources: Unstop, Devfolio, Hack2Skill, MLH (public listings), Devpost,
        HackerEarth. Open source (MIT) by Pranav Shinde.
      </p>
    </footer>
  );
}
