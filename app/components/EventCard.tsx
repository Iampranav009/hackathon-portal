import { AlertTriangle, ArrowUpRight, BadgeCheck, Calendar, Globe, MapPin, ShieldAlert, Trophy } from "lucide-react";
import type { PortalEvent } from "../../lib/events";

function Chip({ children, tone = "stone" }: { children: React.ReactNode; tone?: "stone" | "teal" | "green" }) {
  const tones: Record<string, string> = {
    stone: "bg-neutral-100 text-neutral-700",
    teal: "bg-teal-100 text-teal-800",
    green: "bg-green-100 text-green-800",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Cover({ e }: { e: PortalEvent }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-900">
      {e.banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={e.banner}
          alt={e.bannerSource === "official" ? `Official banner for ${e.title}` : `Category illustration for ${e.title}`}
          loading="lazy"
          className={`h-full w-full ${e.bannerFit === "contain" ? "object-contain p-6" : "object-cover"}`}
        />
      ) : (
        // Solid neutral cover — no gradient, matching the clean minimal theme.
        <div className="flex h-full w-full items-center justify-center p-6 text-center">
          <span className="text-2xl font-extrabold text-white">{e.title}</span>
        </div>
      )}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
          {e.category}
        </span>
        {e.bestFit && (
          <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950">
            Best fit
          </span>
        )}
      </div>
      {e.status === "closed" && (
        <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Closed
        </span>
      )}
      {e.status === "ended" && (
        <span className="absolute right-3 top-3 rounded-full bg-neutral-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Ended
        </span>
      )}
      {e.status === "unconfirmed" && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950">
          Unconfirmed
        </span>
      )}
      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
        {e.bannerSource === "official" ? "Official banner" : "Category illustration"}
      </span>
    </div>
  );
}

/**
 * The one event card, shared by Home and /must-attend (Swipe has its own
 * full-screen card by design). One design, one set of rules:
 * - lucide icons only, no emoji
 * - Verified / Unverified is always shown, never silently omitted
 * - Closed / ended events never get an Apply button — a disabled
 *   "Registration closed" state instead, so nobody taps Apply on a dead event
 */
export function EventCard({ e, typeLabel }: { e: PortalEvent; typeLabel?: string }) {
  const isDead = e.status === "closed" || e.status === "ended";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
      <Cover e={e} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {typeLabel && (
            <span className="rounded-full bg-teal-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {typeLabel}
            </span>
          )}
          <h3 className="text-lg font-bold leading-snug text-neutral-900">{e.title}</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>
            <Calendar className="h-3.5 w-3.5" /> {e.dates || "Dates TBA"}
          </Chip>
          {e.mode && (
            <Chip tone="teal">
              {e.mode === "online" ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              {e.mode === "online" ? "Online" : e.mode === "hybrid" ? "Hybrid" : "Offline"}
            </Chip>
          )}
          {e.city && (
            <Chip>
              <MapPin className="h-3.5 w-3.5" /> {e.city}
            </Chip>
          )}
          {e.fee && <Chip tone="green">{e.fee}</Chip>}
        </div>
        {e.prize && (
          <p className="mt-3 flex items-center gap-1.5 text-base font-extrabold text-neutral-900">
            <Trophy className="h-4 w-4 text-amber-600" /> {e.prize}
            <span className="text-xs font-medium text-neutral-500">prize</span>
          </p>
        )}
        {e.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">{e.description}</p>}
        {e.teams && <p className="mt-1 text-xs text-neutral-500">{e.teams}</p>}
        {e.notes && (
          <p className="mt-3 flex gap-1.5 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {e.notes}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4">
          <div className="text-sm">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Deadline</span>
            <span className="font-bold text-neutral-900">{e.deadline || "TBA"}</span>
          </div>
          {e.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
              <ShieldAlert className="h-3.5 w-3.5" /> Unverified
            </span>
          )}
        </div>
        {isDead ? (
          <span className="mt-4 block rounded-xl bg-neutral-100 px-4 py-3 text-center text-sm font-semibold text-neutral-500">
            Registration closed — check the organiser page for the next edition
          </span>
        ) : e.link ? (
          <a
            href={e.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-teal-800"
          >
            Apply <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : (
          <span className="mt-4 block rounded-xl bg-neutral-100 px-4 py-3 text-center text-sm font-semibold text-neutral-500">
            Link unconfirmed — check the organiser page
          </span>
        )}
        {e.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {e.tags.map((t) => (
              <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                {t}
              </span>
            ))}
          </div>
        )}
        {e.source && (
          <p className="mt-2 text-[11px] text-neutral-400">
            Source: {e.source}
            {e.addedDate ? ` · Added ${e.addedDate}` : ""}
          </p>
        )}
      </div>
    </article>
  );
}
