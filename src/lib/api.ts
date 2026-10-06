import { API_URL, PAGE_SIZE, REVALIDATE_SECONDS } from "./config";
import type { AdDetail, Landing, SitemapLandingRow, Taxonomy } from "./types";

export class ApiNotFound extends Error {}

const API_TIMEOUT_MS = 15_000;

async function get<T>(path: string, revalidate: number = REVALIDATE_SECONDS): Promise<T> {
  // An API that does not answer must not leave the visitor waiting on a blank page.
  // A slow or dropped answer is asked for once more before the page gives up.
  const request = () => fetch(`${API_URL}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(API_TIMEOUT_MS) });
  const response = await request().catch(() => request());
  if (response.status === 404) throw new ApiNotFound(path);
  if (!response.ok) throw new Error(`API ${response.status} for ${path}`);
  return response.json() as Promise<T>;
}

export function getTaxonomy(): Promise<Taxonomy> {
  return get<Taxonomy>("/web/taxonomy", 3600);
}

export interface LandingQuery {
  categoryId?: number;
  cityId?: number;
  regionId?: number;
  regionIds?: number[];
  bedrooms?: number[];
  bathrooms?: number[];
  furnished?: boolean;
  /** Attribute filters as "name:value" */
  attrs?: string[];
  minArea?: number;
  maxArea?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export function getLanding(query: LandingQuery): Promise<Landing> {
  const params = new URLSearchParams();
  if (query.categoryId !== undefined) params.set("category_id", String(query.categoryId));
  if (query.cityId !== undefined) params.set("city_id", String(query.cityId));
  if (query.regionId !== undefined) params.set("region_id", String(query.regionId));
  if (query.regionIds?.length) params.set("region_ids", query.regionIds.join(","));
  if (query.bedrooms?.length) params.set("bedrooms", query.bedrooms.join(","));
  if (query.bathrooms?.length) params.set("bathrooms", query.bathrooms.join(","));
  for (const attr of query.attrs ?? []) params.append("attrs", attr);
  if (query.minArea !== undefined) params.set("min_area", String(query.minArea));
  if (query.maxArea !== undefined) params.set("max_area", String(query.maxArea));
  if (query.furnished !== undefined) params.set("furnished", String(query.furnished));
  if (query.minPrice !== undefined) params.set("min_price", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("max_price", String(query.maxPrice));
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  params.set("page_size", String(query.pageSize ?? PAGE_SIZE));
  return get<Landing>(`/web/landing?${params.toString()}`);
}

export function getAd(id: number): Promise<AdDetail> {
  return get<AdDetail>(`/web/ads/${id}`);
}

export function getSitemapLanding(): Promise<SitemapLandingRow[]> {
  return get<SitemapLandingRow[]>("/web/sitemap/landing", 3600);
}

export function getSitemapAds(page: number, pageSize: number) {
  return get<{ total: number; items: { id: number; slug: string; updated_at: string | null }[] }>(
    `/web/sitemap/ads?page=${page}&page_size=${pageSize}`,
    3600,
  );
}
