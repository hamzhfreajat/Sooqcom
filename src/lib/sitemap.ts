import { getSitemapFeatures, getSitemapLanding, getTaxonomy } from "./api";
import { MIN_ADS_TO_INDEX } from "./config";
import {
  FEATURES,
  type Feature,
  type ListingParams,
  PRICE_CAPS,
  dealOfCategory,
  englishIndexable,
  listingPath,
  pricesPath,
  rentalHomesType,
  supportsBedrooms,
  supportsCap,
  supportsFeature,
  supportsFurnished,
  supportsPriceGuide,
  supportsRentPeriod,
  taxonomyIndex,
  typeOfCategory,
} from "./taxonomy";
import type { Locale } from "./types";

export const ADS_PER_SITEMAP = 5000;

export interface SitemapEntry {
  path: string;
  lastModified?: string;
}

/**
 * Every listing page that has enough ads to be worth indexing, in one language.
 * Built from per-(category, city, region, bedrooms, furnished, rent period) counts, rolled up to each page level.
 */
export async function listingEntries(locale: Locale): Promise<SitemapEntry[]> {
  const [rows, features, taxonomy] = await Promise.all([getSitemapLanding(), getSitemapFeatures(), getTaxonomy()]);
  const index = taxonomyIndex(taxonomy);
  const pages = new Map<string, { params: ListingParams; count: number; latest: string }>();

  const add = (params: ListingParams, count: number, latest: string | null) => {
    const key = listingPath("ar", params);
    const page = pages.get(key);
    if (page) {
      page.count += count;
      if (latest && latest > page.latest) page.latest = latest;
    } else {
      pages.set(key, { params, count, latest: latest ?? "" });
    }
  };

  for (const row of rows) {
    const deal = dealOfCategory(row.category_id, taxonomy);
    if (!deal) continue;
    const city = row.city_id != null ? index.citiesById.get(row.city_id) : undefined;
    const region = city && row.region_id != null ? index.regionsById.get(row.region_id) : undefined;
    const bedrooms = row.bedrooms ?? undefined;

    add({ deal }, row.count, row.latest);
    if (city) add({ deal, city }, row.count, row.latest);
    // A residential rental counts on its own type's pages and on the "بيوت للإيجار" pages
    for (const type of [typeOfCategory(row.category_id, deal, taxonomy), rentalHomesType(row.category_id, deal, taxonomy)]) {
      if (!type) continue;
      add({ deal, type }, row.count, row.latest);
      if (city) add({ deal, type, city }, row.count, row.latest);
      if (city && region) add({ deal, type, city, region }, row.count, row.latest);
      if (bedrooms && supportsBedrooms(type)) {
        add({ deal, type, bedrooms }, row.count, row.latest);
        if (city) add({ deal, type, city, bedrooms }, row.count, row.latest);
        if (city && region) add({ deal, type, city, region, bedrooms }, row.count, row.latest);
      }
      // "شقق مفروشة للإيجار" and "شقق للإيجار اليومي" are searched as often as the plain pages
      if (row.furnished && supportsFurnished(deal, type)) {
        add({ deal, type, furnished: true }, row.count, row.latest);
        if (city) add({ deal, type, city, furnished: true }, row.count, row.latest);
        if (city && region) add({ deal, type, city, region, furnished: true }, row.count, row.latest);
      }
      if (row.rent_period && supportsRentPeriod(deal, type)) {
        const period = row.rent_period;
        add({ deal, type, period }, row.count, row.latest);
        if (city) add({ deal, type, city, period }, row.count, row.latest);
        if (city && region) add({ deal, type, city, region, period }, row.count, row.latest);
      }
    }
  }

  // "من المالك", "فارغة", "بالتقسيط", "طابق أرضي" and the price ceilings
  for (const row of features) {
    const deal = dealOfCategory(row.category_id, taxonomy);
    if (!deal) continue;
    const cap = row.feature.startsWith("cap:") ? Number(row.feature.slice(4)) : undefined;
    const feature = cap === undefined && row.feature in FEATURES ? (row.feature as Feature) : undefined;
    const city = row.city_id != null ? index.citiesById.get(row.city_id) : undefined;
    const region = city && row.region_id != null ? index.regionsById.get(row.region_id) : undefined;
    const extra = cap !== undefined ? { cap } : { feature };
    for (const type of [typeOfCategory(row.category_id, deal, taxonomy), rentalHomesType(row.category_id, deal, taxonomy)]) {
      if (!type) continue;
      if (cap !== undefined ? !(supportsCap(type) && PRICE_CAPS[deal].includes(cap)) : !(feature && supportsFeature(feature, deal, type))) continue;
      add({ deal, type, ...extra }, row.count, row.latest);
      if (city) add({ deal, type, city, ...extra }, row.count, row.latest);
      if (city && region) add({ deal, type, city, region, ...extra }, row.count, row.latest);
    }
  }

  return [...pages.values()]
    .filter((page) => page.count >= MIN_ADS_TO_INDEX && (locale === "ar" || englishIndexable(page.params)))
    .sort((a, b) => b.count - a.count)
    .map((page) => ({ path: listingPath(locale, page.params), lastModified: page.latest || undefined }));
}

/** A price guide is listed when its kind of property has this many ads in the place. */
const MIN_ADS_FOR_PRICE_GUIDE = 150;

/** Price guides: one per kind of property for the country, and one per city with enough ads. */
export async function priceEntries(locale: Locale): Promise<SitemapEntry[]> {
  const [rows, taxonomy] = await Promise.all([getSitemapLanding(), getTaxonomy()]);
  const index = taxonomyIndex(taxonomy);
  const totals = new Map<string, { path: string; count: number; latest: string }>();
  for (const row of rows) {
    const deal = dealOfCategory(row.category_id, taxonomy);
    const type = deal ? typeOfCategory(row.category_id, deal, taxonomy) : undefined;
    if (!deal || !type || !supportsPriceGuide(deal, type)) continue;
    const city = row.city_id != null ? index.citiesById.get(row.city_id) : undefined;
    for (const params of [{ deal, type }, ...(city ? [{ deal, type, city }] : [])]) {
      if (locale === "en" && !englishIndexable({ deal, city: params.city })) continue;
      const path = pricesPath(locale, params);
      const entry = totals.get(path) ?? { path, count: 0, latest: "" };
      entry.count += row.count;
      if (row.latest && row.latest > entry.latest) entry.latest = row.latest;
      totals.set(path, entry);
    }
  }
  return [...totals.values()]
    .filter((entry) => entry.count >= MIN_ADS_FOR_PRICE_GUIDE)
    .sort((a, b) => b.count - a.count)
    .map((entry) => ({ path: entry.path, lastModified: entry.latest || undefined }));
}

export function staticEntries(locale: Locale): SitemapEntry[] {
  const prefix = locale === "en" ? "/en" : "";
  return [{ path: prefix || "/" }, { path: `${prefix}/about` }, { path: `${prefix}/privacy` }, { path: `${prefix}/delete-data` }];
}

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** `image` is the page's main photo; search engines use it to show the page in image results. */
export function urlsetXml(entries: { url: string; lastModified?: string; image?: string | null }[]): string {
  const body = entries
    .map(
      (entry) =>
        `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${entry.lastModified.slice(0, 10)}</lastmod>` : ""}${
          entry.image ? `<image:image><image:loc>${escapeXml(entry.image)}</image:loc></image:image>` : ""
        }</url>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`;
}

export function indexXml(urls: string[]): string {
  const body = urls.map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
