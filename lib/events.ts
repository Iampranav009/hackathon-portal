import hackathons from "../data/events.json";
import community from "../data/community.json";
import watchlist from "../data/watchlist.json";

export type EventStatus = "open" | "closed" | "unconfirmed" | "ended";

export interface PortalEvent {
  id: string;
  title: string;
  slug: string;
  dates: string | null;
  deadline: string | null;
  city: string | null;
  mode: string | null; // "online" | "offline" | "hybrid" | null
  fee: string | null;
  prize: string | null;
  link: string | null;
  source: string | null;
  category: string;
  tags: string[];
  bestFit: boolean;
  verified: boolean;
  status: EventStatus;
  banner: string | null;
  bannerSource: "official" | "placeholder";
  bannerFit: "cover" | "contain";
  description: string | null;
  teams: string | null;
  notes: string | null;
  addedDate: string | null;
  lastScanned: string | null;
}

export interface WatchlistItem {
  title: string;
  details: string;
  link: string | null;
  verified: boolean;
  status: string;
  lastScanned: string | null;
}

export const LAST_SCANNED = "2026-11-23";
export const hackathonEvents: PortalEvent[] = (hackathons as { events: PortalEvent[] }).events;
export const communityEvents: PortalEvent[] = (community as { events: PortalEvent[] }).events;
export const watchlistItems: WatchlistItem[] = (watchlist as { events: WatchlistItem[] }).events;

export const COMMUNITY_CITIES = ["Bengaluru", "Pune", "Mumbai", "Delhi/NCR", "Chennai", "Online/Other"] as const;

/** Closing soon = an open event whose deadline mentions a date in Nov/Dec 2026. */
export function isClosingSoon(e: PortalEvent): boolean {
  if (e.status !== "open" || !e.deadline) return false;
  return /(19|20|21|22|23|24|25|26|27|28|29|30) Nov|Dec 2026|1 Dec|2 Dec|3 Dec|4 Dec|5 Dec|6 Dec|7 Dec/.test(e.deadline);
}

/**
 * "Must Attend" rule — Pranav's shortlist (3rd-year BE CSE, Yavatmal;
 * stack Next.js / React / TypeScript / Python, AI / GenAI agents).
 *
 * An event is Must Attend when ALL of these hold:
 *  1. status is "open" (closed / unconfirmed / ended events never qualify);
 *  2. it is relevant: bestFit is true, OR its category/tags mention
 *     AI / GenAI / agents / ML AND its fee is free or low-cost;
 *  3. it is reachable: mode is "online", OR its city is one of
 *     Bengaluru, Pune, Mumbai, Delhi, Chennai, Nagpur, Amravati or
 *     Yavatmal (a city string containing "Online" counts as online).
 *
 * Uses only fields already in the JSON (bestFit, tags, category, fee,
 * mode, city, status). No new fields, nothing invented: a null fee is
 * treated as "unknown", not as free, and a null city with a hybrid /
 * offline mode does not qualify on location.
 * See docs/ARCHITECTURE.md ("Must Attend" section) for the same rule.
 */
export const MUST_ATTEND_CITIES = [
  "Bengaluru",
  "Pune",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Nagpur",
  "Amravati",
  "Yavatmal",
] as const;

/** Free, or a stated fee of ₹600 or less (a "low-cost" entry). Null fee = unknown, not free. */
export function isFreeOrLowCost(e: PortalEvent): boolean {
  if (!e.fee) return false;
  if (/^free/i.test(e.fee.trim())) return true;
  const m = e.fee.match(/₹\s*([\d,]+)/);
  if (m) {
    const amount = parseInt(m[1].replace(/,/g, ""), 10);
    if (!Number.isNaN(amount) && amount <= 600) return true;
  }
  return false;
}

/** Fee starts with "Free" (covers "Free", "Free entry", "Free · …"). */
export function isFreeEvent(e: PortalEvent): boolean {
  return !!e.fee && /^free/i.test(e.fee.trim());
}

/** A stated paid fee: "Paid", or a ₹ / $ amount that is not free/low-cost. Unknown fees (null, "See listing", "Price TBC", "Unconfirmed", …) are neither Free nor Paid. */
export function isPaidEvent(e: PortalEvent): boolean {
  if (!e.fee || isFreeOrLowCost(e)) return false;
  return /paid|₹|\$|expo/i.test(e.fee);
}

export function isMustAttend(e: PortalEvent): boolean {
  if (e.status !== "open") return false;
  const haystack = [e.category, ...(e.tags || [])].join(" ");
  const isAI = /genai|agentic|ai agents|ai\/ml|\bai\b|\bml\b|agent/i.test(haystack);
  const relevant = e.bestFit || (isAI && isFreeOrLowCost(e));
  if (!relevant) return false;
  const city = (e.city || "").toLowerCase();
  const reachable =
    e.mode === "online" ||
    city.includes("online") ||
    MUST_ATTEND_CITIES.some((c) => city.includes(c.toLowerCase()));
  return reachable;
}

export const mustAttendHackathons: PortalEvent[] = hackathonEvents.filter(isMustAttend);
export const mustAttendCommunity: PortalEvent[] = communityEvents.filter(isMustAttend);
export const mustAttendEvents: PortalEvent[] = [...mustAttendHackathons, ...mustAttendCommunity];
