import type { PortalEvent } from "../../lib/events";

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

function Cover({ e }: { e: PortalEvent }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-900">
      {e.banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={e.banner}
          alt={e.bannerSource === "official" ? `Official banner for ${e.title}` : `Category illustration for ${e.title}`}
          loading="lazy"
          className={`h-full w-full ${e.bannerFit === "contain" ? "object-contain p-6" : "object-cover"}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-600 via-indigo-600 to-stone-900 p-6 text-center">
          <span className="text-2xl font-extrabold text-white">{e.title}</span>
        </div>
      )}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">{e.category}</span>
        {e.bestFit && <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950">⭐ Best fit</span>}
      </div>
      {e.status === "closed" && (
        <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Closed</span>
      )}
      {e.status === "unconfirmed" && (
        <span className="absolute right-3 top-3 rounded-full bg-yellow-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-yellow-950">Unconfirmed</span>
      )}
      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
        {e.bannerSource === "official" ? "Official banner" : "Category illustration"}
      </span>
    </div>
  );
}

/** Devfolio-style event card, shared by the home page and /must-attend. */
export function EventCard({ e, typeLabel }: { e: PortalEvent; typeLabel?: string }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-lg dark:border-stone-800 dark:bg-stone-900">
      <Cover e={e} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {typeLabel && <span className="rounded-full bg-teal-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">{typeLabel}</span>}
          <h3 className="text-lg font-bold leading-snug">{e.title}</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>📅 {e.dates || "Dates TBA"}</Chip>
          {e.mode && <Chip tone="teal">{e.mode === "online" ? "🌐 Online" : e.mode === "hybrid" ? "Hybrid" : "📍 Offline"}</Chip>}
          {e.city && <Chip>📍 {e.city}</Chip>}
          {e.fee && <Chip tone="green">{e.fee}</Chip>}
        </div>
        {e.prize && (
          <p className="mt-3 text-base font-extrabold text-stone-900 dark:text-white">
            🏆 {e.prize} <span className="text-xs font-medium text-stone-500">prize</span>
          </p>
        )}
        {e.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{e.description}</p>}
        {e.teams && <p className="mt-1 text-xs text-stone-500">{e.teams}</p>}
        {e.notes && <p className="mt-3 rounded-lg bg-yellow-50 p-2.5 text-xs leading-relaxed text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">⚠ {e.notes}</p>}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
          <div className="text-sm">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-stone-400">Deadline</span>
            <span className="font-bold text-amber-700 dark:text-amber-300">{e.deadline || "TBA"}</span>
          </div>
          {e.verified && <Chip tone="green">✓ Verified</Chip>}
        </div>
        {e.link ? (
          <a href={e.link} target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-teal-800">
            Apply →
          </a>
        ) : (
          <span className="mt-4 block rounded-xl bg-stone-100 px-4 py-3 text-center text-sm font-semibold text-stone-500 dark:bg-stone-800">
            Link unconfirmed — check the organiser page
          </span>
        )}
        {e.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {e.tags.map((t) => (
              <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">{t}</span>
            ))}
          </div>
        )}
        {e.source && <p className="mt-2 text-[11px] text-stone-400">Source: {e.source}{e.addedDate ? ` · Added ${e.addedDate}` : ""}</p>}
      </div>
    </article>
  );
}
