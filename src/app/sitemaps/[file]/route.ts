import { cachedSitemap, XML_HEADERS } from "@/lib/sitemapCache";
import { buildSitemapFile, isSitemapFile } from "@/lib/sitemapFiles";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const file = (await params).file.replace(/\.xml$/, "");
  if (!isSitemapFile(file)) return new Response("Not found", { status: 404 });

  const xml = await cachedSitemap(file, () => buildSitemapFile(file));
  return new Response(xml, { headers: XML_HEADERS });
}
