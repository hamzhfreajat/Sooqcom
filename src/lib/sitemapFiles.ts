import { getSitemapAds } from "@/lib/api";
import { absolute } from "@/lib/seo";
import { ADS_PER_SITEMAP, listingEntries, priceEntries, staticEntries, urlsetXml } from "@/lib/sitemap";
import { adPath } from "@/lib/taxonomy";

/** True for the names listed in the sitemap index: static, listings-ar, listings-en, ads-N. */
export function isSitemapFile(file: string): boolean {
  return file === "static" || file === "listings-ar" || file === "listings-en" || /^ads-[1-9]\d*$/.test(file);
}

/** Builds one sitemap file (name without ".xml"). Call isSitemapFile first. */
export async function buildSitemapFile(file: string): Promise<string> {
  let entries: { url: string; lastModified?: string; image?: string | null }[];

  if (file === "static") {
    entries = [...staticEntries("ar"), ...staticEntries("en")].map((entry) => ({ url: absolute(entry.path) }));
  } else if (file === "listings-ar" || file === "listings-en") {
    const locale = file.endsWith("en") ? "en" : "ar";
    const [prices, listings] = await Promise.all([priceEntries(locale), listingEntries(locale)]);
    entries = [...prices, ...listings].map((entry) => ({ url: absolute(entry.path), lastModified: entry.lastModified }));
  } else {
    // Ad text is Arabic, so only the Arabic ad pages are listed
    const page = Number(file.slice("ads-".length));
    const { items } = await getSitemapAds(page, ADS_PER_SITEMAP);
    entries = items.map((ad) => ({ url: absolute(adPath("ar", ad)), lastModified: ad.updated_at ?? undefined, image: ad.image }));
  }

  return urlsetXml(entries);
}
