import { NextResponse } from "next/server";
import { FACETS } from "@/components/filters/shared";
import { getTaxonomy } from "@/lib/api";
import type { SmartNote } from "@/lib/filters";
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
  /** -2 basement, -1 ground, 1..7, 100 top floor */
  floor_numbers?: number[];
  not_found_regions?: string[];
}

// The backend's floor numbers -> the values of the website's floor filter
const FLOOR_VALUES: Record<number, string[]> = {
  [-2]: ["طابق التسوية"],
  [-1]: ["الطابق الأرضي"],
  100: ["طابق أخير", "روف", "طابق أخير مع روف"],
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => [n, [String(n)]])),
};

/** The floor filter's option numbers for the floors the backend understood ("?floor=3,4"). */
function floorOptions(numbers: number[] = []): string {
  const options = FACETS.find((facet) => facet.key === "floor")?.options ?? [];
  const picked = numbers
    .flatMap((n) => FLOOR_VALUES[n] ?? [])
    .map((value) => options.findIndex((option) => option.value === value) + 1)
    .filter((index) => index > 0);
  return [...new Set(picked)].sort((a, b) => a - b).join(",");
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

  let data: {
    intent?: string;
    action_required?: string | null;
    suggestion?: string | null;
    filters_applied?: SmartFilters;
    /** Filters the backend dropped or widened to find results */
    relaxed?: string[];
  };
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
  const floors = floorOptions(f.floor_numbers);
  if (floors) query.set("floor", floors);

  // What had to give to find results, so the page can say it instead of showing a whole city unexplained
  const notes = new Set<SmartNote>(
    (data.relaxed ?? []).filter((code): code is SmartNote => ["region", "floor", "price", "area", "features"].includes(code)),
  );
  if (f.not_found_regions?.length && !notes.has("region")) notes.add("missing");
  if (notes.size) query.set("sn", [...notes].join(","));

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
