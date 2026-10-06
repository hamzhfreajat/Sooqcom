import { FACETS, type FilterOptions, type FilterValue, type Furnishing } from "@/components/filters/shared";
import { dict } from "./i18n";
import {
  BEDROOM_SLUG_SUFFIX,
  DEALS,
  FURNISHED_SLUG,
  PROPERTY_TYPES,
  RENT_PERIODS,
  placeName,
  placeSlug,
  supportsBedrooms,
  supportsFurnished,
  supportsRentPeriod,
} from "./taxonomy";
import type { Deal, Locale, Taxonomy } from "./types";

export type SearchParams = Record<string, string | string[] | undefined>;

export const SORTS = ["newest", "price_asc", "price_desc"] as const;
export type Sort = (typeof SORTS)[number];

export interface ListingQuery {
  page: number;
  sort: Sort;
  /** Category below the page's own type, at any depth */
  cat?: number;
  regions?: number[];
  minPrice?: number;
  maxPrice?: number;
  beds?: number[];
  baths?: number[];
  furnished?: Furnishing;
  minArea?: number;
  maxArea?: number;
  facets?: Record<string, number[]>;
  /** The sentence typed into smart search, shown back to the user */
  q?: string;
}

const first = (searchParams: SearchParams, key: string) =>
  (Array.isArray(searchParams[key]) ? searchParams[key]?.[0] : searchParams[key]) as string | undefined;

export function readQuery(searchParams: SearchParams): ListingQuery {
  const positive = (key: string) => {
    const value = Number(first(searchParams, key));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
  };
  /** A comma-separated list of whole numbers within a range, without repeats */
  const list = (key: string, min: number, max: number, limit = 20) => {
    const values = (first(searchParams, key) ?? "")
      .split(",")
      .filter((part) => /^\d{1,9}$/.test(part))
      .map(Number)
      .filter((value) => value >= min && value <= max);
    const unique = [...new Set(values)].sort((a, b) => a - b).slice(0, limit);
    return unique.length ? unique : undefined;
  };
  const sort = SORTS.includes(first(searchParams, "sort") as Sort) ? (first(searchParams, "sort") as Sort) : "newest";
  const furn = first(searchParams, "furn");
  const facets: Record<string, number[]> = {};
  for (const facet of FACETS) {
    const chosen = list(facet.key, 1, facet.options.length);
    if (chosen) facets[facet.key] = chosen;
  }
  return {
    page: Math.min(positive("page") ?? 1, 500),
    sort,
    cat: positive("cat"),
    regions: list("regions", 1, 999_999_999, 50),
    minPrice: positive("min"),
    maxPrice: positive("max"),
    beds: list("beds", 0, 6),
    baths: list("baths", 1, 6),
    furnished: furn === "1" ? "yes" : furn === "0" ? "no" : furn === "p" ? "partial" : undefined,
    minArea: positive("amin"),
    maxArea: positive("amax"),
    facets: Object.keys(facets).length ? facets : undefined,
    q: first(searchParams, "q")?.slice(0, 300),
  };
}

/** True when the page is narrowed by anything that is not part of its address. */
export function isRefined(query: ListingQuery): boolean {
  return (
    query.sort !== "newest" ||
    query.cat !== undefined ||
    query.regions !== undefined ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined ||
    query.beds !== undefined ||
    query.baths !== undefined ||
    query.furnished !== undefined ||
    query.minArea !== undefined ||
    query.maxArea !== undefined ||
    query.facets !== undefined ||
    query.q !== undefined
  );
}

/** English names for the upper levels of the category tree; deeper levels keep their Arabic names. */
const GROUP_NAMES_EN: Record<number, string> = {
  310: "Residential", 10310: "Residential", 311: "Commercial", 10311: "Commercial", 316: "Country houses",
  3061: "Student housing (male)", 3062: "Student housing (female)", 3063: "Staff housing (male)", 3064: "Staff housing (female)",
  3065: "Private room", 3066: "Bed in a shared room", 5050717: "Residential buildings",
  19000: "Residential lands", 19010: "Commercial lands", 19020: "Industrial lands", 19030: "Agricultural lands", 19040: "Tourism lands",
};

/** Everything the listing filters need to build page addresses in the browser. */
export function filterOptions(locale: Locale, taxonomy: Taxonomy): FilterOptions {
  const t = dict(locale);
  const en = locale === "en";
  const typed = new Map<number, (typeof PROPERTY_TYPES)[number]>();
  for (const type of PROPERTY_TYPES) for (const id of Object.values(type.ids)) typed.set(id as number, type);

  return {
    locale,
    prefix: en ? "/en" : "",
    bedroomSuffix: BEDROOM_SLUG_SUFFIX[locale],
    furnishedSlug: FURNISHED_SLUG[locale],
    periodSlugs: Object.fromEntries(Object.values(RENT_PERIODS).map((period) => [period.option, period.slug[locale]])),
    deals: (["rent", "sale"] as Deal[]).map((deal) => ({ slug: DEALS[deal].slug[locale], label: deal === "rent" ? t.nav_rent : t.nav_sale, rootId: DEALS[deal].id })),
    rentDeal: DEALS.rent.slug[locale],
    categories: taxonomy.categories.map((category) => {
      const type = typed.get(category.id);
      return {
        id: category.id,
        parentId: category.parent_id,
        name: en ? type?.label.en ?? GROUP_NAMES_EN[category.id] ?? category.name : category.name,
        slug: type?.slug[locale],
        bedsInPath: type ? supportsBedrooms(type) : undefined,
        furnishedInPath: type ? supportsFurnished("rent", type) : undefined,
        periodInPath: type ? supportsRentPeriod("rent", type) : undefined,
      };
    }),
    cities: taxonomy.cities.map((city) => ({ id: city.id, slug: placeSlug(city, locale), name: placeName(city, locale) })),
    regions: taxonomy.regions
      .map((region) => ({ id: region.id, cityId: region.city_id, slug: placeSlug(region, locale), name: placeName(region, locale) }))
      .sort((a, b) => a.name.localeCompare(b.name, locale)),
    labels: {
      filters: t.filters, location: t.filter_location, locationPlaceholder: t.location_placeholder, cities: t.cities,
      popularIn: t.popular_in, noMatch: t.no_match, city: t.city_word, type: t.filter_type, anyType: t.any_type,
      price: t.filter_price, perMonth: t.per_month, from: t.price_from, to: t.price_to, upTo: t.up_to, thousand: t.thousand,
      beds: t.filter_bedrooms, baths: en ? "Bathrooms" : "عدد الحمامات", any: t.any, studio: t.studio, furnishing: t.furnishing,
      furnished: t.furnished, unfurnished: t.unfurnished, partlyFurnished: en ? "Partly furnished" : "مفروش جزئياً",
      area: t.area, apply: t.apply, clear: t.clear_filters, showResults: t.show_results, sort: t.sort,
      newest: t.sort_newest, priceAsc: t.sort_price_asc, priceDesc: t.sort_price_desc, currency: t.currency, sqm: t.sqm,
      close: t.close, clearLocation: t.clear_location, allJordan: t.all_jordan,
      areasOf: en ? "Areas of" : "مناطق", allOf: en ? "All of" : "كل", changeCity: en ? "Change city" : "تغيير المدينة",
      areasCount: en ? "areas" : "مناطق", searchArea: en ? "Search for an area in" : "ابحث عن منطقة في",
      otherPlaces: en ? "Other places" : "أماكن أخرى", category: en ? "Category" : "القسم", all: t.all,
      typeOf: en ? "Type of" : "نوع", remove: en ? "Remove" : "إزالة", activeFilters: en ? "Your filters" : "اختياراتك",
      bedsUnit: en ? "bed" : "غرف", bathsUnit: en ? "bath" : "حمامات", selected: en ? "selected" : "محددة",
      showAll: en ? "Show all" : "عرض الكل", clearOne: en ? "Clear" : "مسح", anyPrice: en ? "Any price" : "أي سعر",
      minimum: en ? "Min" : "الأدنى", maximum: en ? "Max" : "الأعلى",
    },
  };
}

/** The filter state of a listing page, as the filter components expect it. */
export function toFilterValue(dealSlug: string, query: ListingQuery, place: { cat?: number; cityId?: number; regionIds?: number[]; beds?: number[]; furnished?: Furnishing; period?: number }): FilterValue {
  // A rent period in the page's address counts as the chosen "dur" filter
  const facets = place.period ? { ...query.facets, dur: [place.period] } : query.facets;
  return {
    deal: dealSlug,
    cat: place.cat,
    cityId: place.cityId,
    regionIds: place.regionIds,
    beds: place.beds ?? query.beds,
    baths: query.baths,
    furnished: place.furnished ?? query.furnished,
    min: query.minPrice,
    max: query.maxPrice,
    amin: query.minArea,
    amax: query.maxArea,
    sort: query.sort,
    facets,
  };
}
