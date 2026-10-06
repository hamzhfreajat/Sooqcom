import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { ApiNotFound, getAd, getTaxonomy } from "@/lib/api";
import { AD_SEGMENT, type ListingParams, adPath, resolveListing } from "@/lib/taxonomy";
import type { AdDetail, Locale } from "@/lib/types";
import AdView, { adMetadata } from "./AdView";
import ListingView, { type SearchParams, listingMetadata } from "./ListingView";

type Resolved = { kind: "ad"; ad: AdDetail; requested: string } | { kind: "listing"; params: ListingParams } | null;

function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Works out which page a path refers to. Cached per request, so metadata and page share one lookup. */
const resolve = cache(async (locale: Locale, joined: string): Promise<Resolved> => {
  const segments = joined.split("/").map(decode);

  if (segments[0] === AD_SEGMENT[locale]) {
    const id = Number((segments[1] ?? "").match(/^\d+/)?.[0]);
    if (segments.length !== 2 || !Number.isSafeInteger(id) || id <= 0) return null;
    try {
      return { kind: "ad", ad: await getAd(id), requested: segments[1] };
    } catch (error) {
      if (error instanceof ApiNotFound) return null;
      throw error;
    }
  }

  const params = resolveListing(locale, segments, await getTaxonomy());
  return params ? { kind: "listing", params } : null;
});

interface RouteProps {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<SearchParams>;
}

/** The catch-all route of one language: listing pages and ad pages share it. */
export function makeRoute(locale: Locale) {
  async function generateMetadata({ params, searchParams }: RouteProps): Promise<Metadata> {
    const resolved = await resolve(locale, (await params).path.join("/"));
    if (!resolved) return { robots: { index: false, follow: false } };
    if (resolved.kind === "ad") return adMetadata(locale, resolved.ad);
    return listingMetadata(locale, resolved.params, await searchParams);
  }

  async function Page({ params, searchParams }: RouteProps) {
    const resolved = await resolve(locale, (await params).path.join("/"));
    if (!resolved) notFound();

    if (resolved.kind === "ad") {
      // One address per ad: an old or partial slug is redirected to the current one
      const canonical = `${resolved.ad.id}-${resolved.ad.slug}`;
      if (resolved.ad.slug && resolved.requested !== canonical) {
        permanentRedirect(encodeURI(adPath(locale, resolved.ad)));
      }
      return <AdView locale={locale} ad={resolved.ad} />;
    }
    return <ListingView locale={locale} params={resolved.params} searchParams={await searchParams} />;
  }

  return { generateMetadata, Page };
}
