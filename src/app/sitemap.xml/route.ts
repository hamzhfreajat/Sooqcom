import { getSitemapAds } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { ADS_PER_SITEMAP, indexXml } from "@/lib/sitemap";
import { cachedSitemap, warmSitemaps, XML_HEADERS } from "@/lib/sitemapCache";
import { buildSitemapFile } from "@/lib/sitemapFiles";

export const dynamic = "force-dynamic";

async function sitemapFiles(): Promise<string[]> {
  const { total } = await getSitemapAds(1, 1);
  const adFiles = Math.max(1, Math.ceil(total / ADS_PER_SITEMAP));
  return ["static", "listings-ar", "listings-en", ...Array.from({ length: adFiles }, (_, i) => `ads-${i + 1}`)];
}

/** Sitemap index: static pages, listing pages per language, and ads in chunks. */
export async function GET() {
  const xml = await cachedSitemap("index", async () => {
    const files = await sitemapFiles();
    // Google reads the files listed here right after the index: have them built by then
    warmSitemaps(files.map((file) => ({ key: file, make: () => buildSitemapFile(file) })));
    return indexXml(files.map((file) => `${SITE_URL}/sitemaps/${file}.xml`));
  });
  return new Response(xml, { headers: XML_HEADERS });
}
