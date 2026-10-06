import { getSitemapAds } from "@/lib/api";
import { absolute } from "@/lib/seo";
import { ADS_PER_SITEMAP, listingEntries, staticEntries, urlsetXml } from "@/lib/sitemap";
import { adPath } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const file = (await params).file.replace(/\.xml$/, "");
  let entries: { url: string; lastModified?: string }[] | null = null;

  if (file === "static") {
    entries = [...staticEntries("ar"), ...staticEntries("en")].map((entry) => ({ url: absolute(entry.path) }));
  } else if (file === "listings-ar" || file === "listings-en") {
    const locale = file.endsWith("en") ? "en" : "ar";
    entries = (await listingEntries(locale)).map((entry) => ({ url: absolute(entry.path), lastModified: entry.lastModified }));
  } else {
    const match = file.match(/^ads-(\d+)$/);
    if (match) {
      // Ad text is Arabic, so only the Arabic ad pages are listed
      const { items } = await getSitemapAds(Number(match[1]), ADS_PER_SITEMAP);
      entries = items.map((ad) => ({ url: absolute(adPath("ar", ad)), lastModified: ad.updated_at ?? undefined }));
    }
  }

  if (!entries) return new Response("Not found", { status: 404 });
  return new Response(urlsetXml(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
