import { NextResponse } from "next/server";
import { getTaxonomy } from "@/lib/api";
import { ACCOUNT_API_URL } from "@/lib/session";
import {
  type ListingParams,
  dealOfCategory,
  listingPath,
  postPath,
  searchPath,
  supportsBedrooms,
  taxonomyIndex,
  typeOfCategory,
} from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";

interface SmartFilters {
  category_id?: number | null;
  city_id?: number | null;
  region_ids?: number[];
  min_price?: number | null;
  max_price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnished?: boolean | null;
  min_area?: number | null;
  max_area?: number | null;
}

/**
 * Sends the user's sentence to the backend's smart search and turns the
 * filters it understood into the address of a results page.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { text?: string; locale?: Locale };
  const text = (body.text ?? "").trim().slice(0, 600);
  const locale: Locale = body.locale === "en" ? "en" : "ar";
  if (text.length < 3) return NextResponse.json({ error: "empty" }, { status: 400 });

  let data: { intent?: string; action_required?: string | null; suggestion?: string | null; filters_applied?: SmartFilters };
  try {
    const response = await fetch(`${ACCOUNT_API_URL}/smart-voice-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "failed" }, { status: 502 });
    data = await response.json();
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }

  if (data.intent === "post_ad") return NextResponse.json({ url: postPath(locale) });
  // The backend asks a question when the request is ambiguous (rent or sale? which city?)
  if (data.action_required) return NextResponse.json({ message: data.action_required });

  const f = data.filters_applied ?? {};
  const taxonomy = await getTaxonomy();
  const index = taxonomyIndex(taxonomy);
  const deal = f.category_id ? dealOfCategory(f.category_id, taxonomy) : undefined;
  const regions = (f.region_ids ?? []).filter((id) => index.regionsById.has(id));
  const city = f.city_id ? index.citiesById.get(f.city_id) : undefined;

  const query = new URLSearchParams();
  const setNumber = (key: string, value?: number | null) => {
    if (value != null && value > 0) query.set(key, String(Math.round(value)));
  };
  setNumber("min", f.min_price);
  setNumber("max", f.max_price);
  setNumber("baths", f.bathrooms);
  setNumber("amin", f.min_area);
  setNumber("amax", f.max_area);
  if (f.furnished != null) query.set("furn", f.furnished ? "1" : "0");

  // A single region (or none) maps onto a normal listing page; several regions need the search page
  if (deal && regions.length <= 1) {
    const type = f.category_id ? typeOfCategory(f.category_id, deal, taxonomy) : undefined;
    const region = regions.length === 1 ? index.regionsById.get(regions[0]) : undefined;
    const params: ListingParams = { deal, type, city, region: city && region?.city_id === city.id ? region : undefined };
    if (f.bedrooms != null) {
      if (supportsBedrooms(type) && f.bedrooms >= 1 && f.bedrooms <= 6) params.bedrooms = f.bedrooms;
      else query.set("beds", String(f.bedrooms));
    }
    query.set("q", text);
    return NextResponse.json({ url: `${listingPath(locale, params)}?${query.toString()}`, note: data.suggestion ?? null });
  }

  if (f.category_id) query.set("cat", String(f.category_id));
  if (city) query.set("city", String(city.id));
  if (regions.length) query.set("regions", regions.join(","));
  if (f.bedrooms != null) query.set("beds", String(f.bedrooms));
  query.set("q", text);
  return NextResponse.json({ url: `${searchPath(locale)}?${query.toString()}`, note: data.suggestion ?? null });
}
