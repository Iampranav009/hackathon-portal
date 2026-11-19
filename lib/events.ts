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

export const LAST_SCANNED = "2026-11-19";
export const hackathonEvents: PortalEvent[] = (hackathons as { events: PortalEvent[] }).events;
export const communityEvents: PortalEvent[] = (community as { events: PortalEvent[] }).events;
export const watchlistItems: WatchlistItem[] = (watchlist as { events: WatchlistItem[] }).events;

export const COMMUNITY_CITIES = ["Bengaluru", "Pune", "Mumbai", "Delhi/NCR", "Chennai", "Online/Other"] as const;

/** Closing soon = an open event whose deadline mentions a date in Nov/Dec 2026. */
export function isClosingSoon(e: PortalEvent): boolean {
  if (e.status !== "open" || !e.deadline) return false;
  return /(19|20|21|22|23|24|25|26|27|28|29|30) Nov|Dec 2026|1 Dec|2 Dec|3 Dec|4 Dec|5 Dec|6 Dec|7 Dec/.test(e.deadline);
}
