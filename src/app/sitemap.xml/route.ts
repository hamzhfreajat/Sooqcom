import { getSitemapAds } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { ADS_PER_SITEMAP, indexXml } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

/** Sitemap index: static pages, listing pages per language, and ads in chunks. */
export async function GET() {
  const { total } = await getSitemapAds(1, 1);
  const adFiles = Math.max(1, Math.ceil(total / ADS_PER_SITEMAP));
  const files = ["static", "listings-ar", "listings-en", ...Array.from({ length: adFiles }, (_, i) => `ads-${i + 1}`)];
  return new Response(indexXml(files.map((file) => `${SITE_URL}/sitemaps/${file}.xml`)), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
