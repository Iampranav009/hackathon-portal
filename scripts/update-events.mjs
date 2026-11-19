/**
 * Daily auto-update for the hackathon portal — public, no-login sources ONLY.
 *
 * What it does:
 *  - Fetches Devpost's public hackathons listing page and reads its
 *    embedded JSON-LD event list (no login, no API key, no RSS —
 *    Devpost has no public hackathons RSS feed).
 *  - Normalises new items into the same JSON schema as data/events.json.
 *  - Dedupes by title + link. Only ADDS new events.
 *  - NEVER overwrites a manually verified field with a blank value: existing
 *    entries are left completely untouched. Only the top-level lastScanned
 *    date is updated.
 *  - Writes back data/events.json (and updates its lastScanned).
 *
 * What it deliberately does NOT do:
 *  - No Unstop / Devfolio / Hack2Skill logins. Those sites are login- or
 *    JS-protected, so their new listings come from the daily Muse scan,
 *    which a human reviews and commits to data/events.json.
 *    See README.md ("Updating events") and docs/ARCHITECTURE.md.
 *
 * Run locally:  npm run update-events
 * Run in CI:    .github/workflows/daily-update.yml (daily ~08:30 IST, no secrets)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const EVENTS_PATH = path.join(root, "data", "events.json");
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD in IST

const SOURCES = [
  // Devpost has no public hackathons RSS feed (devpost.com/hackathons/rss
  // returns 404, verified 19 Nov 2026), so the script reads Devpost's
  // public, no-login hackathons listing page instead. It is server-rendered
  // text, so a plain fetch works — no login, no JS, no API key.
  { name: "Devpost", url: "https://devpost.com/hackathons", kind: "html" },
];

function normKey(title, link) {
  return `${(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "")}|${(link || "").toLowerCase().replace(/\/$/, "")}`;
}
function slugify(title) {
  return (title || "event").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "event";
}

// Parse Devpost's listing page. The page lists events as:
//   ### Title
//   - When: <start> to <end>
//   - Where: <location …>
//   - Tickets: <price>
// We keep only India-relevant items (location mentions India, price in
// INR, or the title mentions India) so the portal is not flooded with
// US campus hackathons. Everything added is marked unconfirmed.
function parseDevpostHtml(htmlText) {
  // Devpost embeds a JSON-LD ItemList ("challenges-json-ld") with every
  // listed hackathon: name, its own .devpost.com URL, start/end dates,
  // location address and ticket price. Parse that — never scrape the
  // visible HTML layout, which changes more often.
  const m = htmlText.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  let doc;
  try { doc = JSON.parse(m[1]); } catch { return []; }
  const items = [];
  const fmt = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d) ? null : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  };
  for (const el of doc.itemListElement || []) {
    const it = el.item || {};
    const addr = (it.location && it.location.address) || {};
    const addrText = JSON.stringify(addr);
    const desc = it.description || "";
    const isIndia = /india/i.test(addrText) || /india/i.test(it.name || "") || /india/i.test(desc) || (it.offers && it.offers.priceCurrency === "INR");
    if (!isIndia) continue; // keep the portal India-focused, not US campus events
    const url = (it.location && it.location.url) || (it["@id"] || "").replace(/#event$/, "") || "https://devpost.com/hackathons";
    const start = fmt(it.startDate), end = fmt(it.endDate);
    const city = addr.addressLocality || addr.addressRegion || "India";
    const online = addr.name === "Online" || /online/i.test(addr.name || "");
    items.push({
      id: slugify(it.name),
      title: it.name,
      slug: slugify(it.name),
      dates: start && end ? `${start} – ${end}` : (start || null),
      deadline: end ? `Ends ${end}` : null,
      city,
      mode: online ? "online" : "offline",
      fee: it.offers && Number(it.offers.price) === 0 ? "Free" : null,
      prize: null,
      link: url,
      source: "Devpost",
      category: "New — auto-update",
      tags: [],
      bestFit: false,
      verified: false,
      status: "unconfirmed",
      banner: null,
      bannerSource: "placeholder",
      bannerFit: "cover",
      description: desc ? desc.slice(0, 300) : null,
      teams: null,
      notes: "Added by the daily auto-update from Devpost's public listing — not yet manually verified. Verify date, eligibility and deadline on the event page before applying.",
      addedDate: today,
      lastScanned: today,
    });
  }
  return items;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "hackathon-portal-daily-update (+https://github.com/Iampranav009)" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

const data = JSON.parse(readFileSync(EVENTS_PATH, "utf-8"));
const existing = new Set((data.events || []).map((e) => normKey(e.title, e.link)));
let added = 0;

for (const src of SOURCES) {
  try {
    const text = await fetchText(src.url);
    const found = src.kind === "html" ? parseDevpostHtml(text) : [];
    for (const item of found) {
      if (existing.has(normKey(item.title, item.link))) continue;
      existing.add(normKey(item.title, item.link));
      data.events.push(item);
      added++;
      console.log(`+ ${item.title} (${item.link})`);
    }
    console.log(`${src.name}: ${found.length} items seen, ${added} new so far`);
  } catch (err) {
    console.warn(`WARN: ${src.name} fetch failed (${err.message}) — keeping existing data unchanged.`);
  }
}

// Only the top-level lastScanned changes for existing entries; their own
// fields are never overwritten by this script.
data.lastScanned = today;
data.count = data.events.length;
writeFileSync(EVENTS_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
console.log(`Done. Added ${added} new event(s). Total: ${data.events.length}. lastScanned=${today}`);
