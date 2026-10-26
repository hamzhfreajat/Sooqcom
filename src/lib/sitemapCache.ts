/**
 * Keeps each finished sitemap file in memory so Googlebot never waits for it to be built.
 *
 * A file younger than FRESH_MS is served as is. An older one is still served at once
 * while a new copy is built in the background. Only the very first request for a file
 * (after a deploy or restart) waits for the build. If a rebuild fails, the old copy
 * keeps being served.
 */
const FRESH_MS = 60 * 60 * 1000;

type Entry = { xml: string; builtAt: number };

const files = new Map<string, Entry>();
const building = new Map<string, Promise<string>>();

function build(key: string, make: () => Promise<string>): Promise<string> {
  const running = building.get(key);
  if (running) return running; // many crawler hits at once share one build
  const job = make()
    .then((xml) => {
      files.set(key, { xml, builtAt: Date.now() });
      return xml;
    })
    .finally(() => building.delete(key));
  building.set(key, job);
  return job;
}

export async function cachedSitemap(key: string, make: () => Promise<string>): Promise<string> {
  const entry = files.get(key);
  if (!entry) return build(key, make);
  if (Date.now() - entry.builtAt > FRESH_MS) {
    build(key, make).catch((error) => console.error(`sitemap ${key}: refresh failed, serving the old copy`, error));
  }
  return entry.xml;
}

/** Starts building files nobody asked for yet, so they are ready when the crawler gets to them. */
export function warmSitemaps(jobs: { key: string; make: () => Promise<string> }[]) {
  for (const { key, make } of jobs) {
    if (files.has(key) || building.has(key)) continue;
    build(key, make).catch((error) => console.error(`sitemap ${key}: warm-up failed`, error));
  }
}

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  // Lets a CDN or proxy in front of the site keep a copy too
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
};
