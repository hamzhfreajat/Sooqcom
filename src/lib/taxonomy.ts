/**
 * The site's URL scheme.
 *
 *   Arabic (default):  /للإيجار/شقق/عمان/خلدا/3-غرف-نوم     /للإيجار/شقق/عمان/مفروشة
 *   English:           /en/rent/apartments/amman/khalda/3-bedrooms
 *   Ad:                /اعلان/61766-عنوان-الاعلان      /en/ad/61766-...
 *
 * Every part after the deal is optional, in this order: type, city, region,
 * one refinement. Deeper combinations are served with query parameters and are
 * not indexed, so search engines see a clean, finite set of pages.
 */
import type { City, Deal, Locale, Region, Taxonomy } from "./types";

export const LOCALES: Locale[] = ["ar", "en"];

export const DEALS: Record<Deal, { id: number; slug: Record<Locale, string>; label: Record<Locale, string> }> = {
  rent: { id: 3, slug: { ar: "للإيجار", en: "rent" }, label: { ar: "للإيجار", en: "for Rent" } },
  sale: { id: 2, slug: { ar: "للبيع", en: "sale" }, label: { ar: "للبيع", en: "for Sale" } },
};

export interface PropertyType {
  key: string;
  /** Backend category id per deal. A type missing a deal does not exist for it. */
  ids: Partial<Record<Deal, number>>;
  slug: Record<Locale, string>;
  label: Record<Locale, string>;
  icon: string;
  /** Arabic grammar: the name takes "مفروش" instead of "مفروشة" */
  masculine?: boolean;
}

// Names and addresses follow the words people type into search engines
// ("استوديو للايجار", "بيوت للايجار", "سكن طالبات"), not the app's category names.
export const PROPERTY_TYPES: PropertyType[] = [
  { key: "apartments", ids: { rent: 301, sale: 10301 }, slug: { ar: "شقق", en: "apartments" }, label: { ar: "شقق", en: "Apartments" }, icon: "building" },
  { key: "studios", ids: { rent: 302, sale: 10302 }, slug: { ar: "استوديو", en: "studios" }, label: { ar: "استوديو", en: "Studios" }, icon: "door", masculine: true },
  { key: "houses", ids: { rent: 3102, sale: 10102 }, slug: { ar: "بيوت", en: "houses" }, label: { ar: "بيوت", en: "Houses" }, icon: "home" },
  { key: "villas", ids: { rent: 3101, sale: 10101 }, slug: { ar: "فلل", en: "villas" }, label: { ar: "فلل وقصور", en: "Villas" }, icon: "villa" },
  { key: "lands", ids: { sale: 10313 }, slug: { ar: "أراضي", en: "lands" }, label: { ar: "أراضي", en: "Lands" }, icon: "land" },
  { key: "duplex", ids: { rent: 3103, sale: 10103 }, slug: { ar: "دوبلكس", en: "duplex" }, label: { ar: "دوبلكس وبنتهاوس", en: "Duplexes & Penthouses" }, icon: "layers", masculine: true },
  { key: "roof", ids: { rent: 3105, sale: 10105 }, slug: { ar: "روف", en: "roof" }, label: { ar: "روف وملحق", en: "Rooftop Units" }, icon: "roof", masculine: true },
  { key: "full-floor", ids: { rent: 3104, sale: 10104 }, slug: { ar: "طابق-كامل", en: "full-floor" }, label: { ar: "طابق كامل", en: "Full Floors" }, icon: "layers", masculine: true },
  // The three below are parts of shared housing; an ad belongs to the nearest type above its category
  { key: "student-female", ids: { rent: 3062 }, slug: { ar: "سكن-طالبات", en: "female-student-housing" }, label: { ar: "سكن طالبات", en: "Female Student Housing" }, icon: "users", masculine: true },
  { key: "student-male", ids: { rent: 3061 }, slug: { ar: "سكن-طلاب", en: "male-student-housing" }, label: { ar: "سكن طلاب", en: "Male Student Housing" }, icon: "users", masculine: true },
  { key: "rooms", ids: { rent: 3065 }, slug: { ar: "غرف", en: "rooms" }, label: { ar: "غرف", en: "Rooms" }, icon: "door" },
  { key: "shared", ids: { rent: 306 }, slug: { ar: "سكن-مشترك", en: "shared-housing" }, label: { ar: "سكن مشترك", en: "Shared Housing" }, icon: "users", masculine: true },
  { key: "shops", ids: { rent: 303, sale: 10303 }, slug: { ar: "محلات", en: "shops" }, label: { ar: "محلات ومعارض", en: "Shops" }, icon: "store" },
  { key: "offices", ids: { rent: 304, sale: 10304 }, slug: { ar: "مكاتب", en: "offices" }, label: { ar: "مكاتب", en: "Offices" }, icon: "briefcase" },
  { key: "commercial-buildings", ids: { sale: 18032 }, slug: { ar: "مباني-تجارية", en: "commercial-buildings" }, label: { ar: "مباني تجارية", en: "Commercial Buildings" }, icon: "building" },
  { key: "warehouses", ids: { sale: 10912 }, slug: { ar: "مخازن", en: "warehouses" }, label: { ar: "مخازن ومستودعات", en: "Warehouses" }, icon: "box" },
  { key: "farms", ids: { rent: 314, sale: 10314 }, slug: { ar: "مزارع", en: "farms" }, label: { ar: "مزارع", en: "Farms" }, icon: "tree" },
  { key: "chalets", ids: { rent: 315, sale: 10315 }, slug: { ar: "شاليهات", en: "chalets" }, label: { ar: "شاليهات", en: "Chalets" }, icon: "sun" },
];

/** Types where the number of bedrooms is a meaningful refinement. */
const BEDROOM_TYPES = new Set(["apartments", "houses", "villas", "duplex", "roof", "full-floor"]);
export const supportsBedrooms = (type?: PropertyType) => !!type && BEDROOM_TYPES.has(type.key);

export const AD_SEGMENT: Record<Locale, string> = { ar: "اعلان", en: "ad" };
export const FURNISHED_SLUG: Record<Locale, string> = { ar: "مفروشة", en: "furnished" };

/** Rent periods with a page of their own ("شقق للإيجار اليومي"). `option` is the period's number in the "dur" filter. */
export type RentPeriod = "daily" | "monthly";
export const RENT_PERIODS: Record<RentPeriod, { option: number; slug: Record<Locale, string>; label: Record<Locale, string> }> = {
  daily: { option: 1, slug: { ar: "يومي", en: "daily" }, label: { ar: "اليومي", en: "Daily" } },
  monthly: { option: 3, slug: { ar: "شهري", en: "monthly" }, label: { ar: "الشهري", en: "Monthly" } },
};
/** Daily and monthly letting only makes sense for places people live in. */
const PERIOD_TYPES = new Set(["apartments", "studios", "houses", "villas", "roof", "chalets", "farms", "rooms"]);
export const supportsRentPeriod = (deal: Deal, type?: PropertyType) => deal === "rent" && !!type && PERIOD_TYPES.has(type.key);
/** Furnished pages exist for rentals of anything except land. */
export const supportsFurnished = (deal: Deal, type?: PropertyType) => deal === "rent" && !!type;
const BEDROOM_SUFFIX: Record<Locale, string> = { ar: "غرف-نوم", en: "bedrooms" };
/** Fixed pages that are not listings: smart-search results and the post-an-ad flow. */
export const searchPath = (locale: Locale) => `${locale === "en" ? "/en" : ""}/search`;
export const postPath = (locale: Locale) => `${locale === "en" ? "/en" : ""}/post`;

export const isLatin = (value?: string | null) => !!value && /[A-Za-z]/.test(value) && !/[؀-ۿ]/.test(value);

export function slugifyName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s/\\()،,.'"`]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function placeName(place: City, locale: Locale): string {
  if (locale === "en" && isLatin(place.name_en)) {
    return place.name_en.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }
  return place.name_ar;
}

export function placeSlug(place: City, locale: Locale): string {
  return slugifyName(locale === "en" && isLatin(place.name_en) ? place.name_en : place.name_ar);
}

/** English pages are only offered to search engines when the place has an English name. */
export const hasEnglishName = (place?: City | null) => !place || isLatin(place.name_en);

export interface ListingParams {
  deal: Deal;
  type?: PropertyType;
  city?: City;
  region?: Region;
  bedrooms?: number;
  furnished?: boolean;
  period?: RentPeriod;
}

export function categoryIdFor(params: ListingParams): number {
  return params.type?.ids[params.deal] ?? DEALS[params.deal].id;
}

export function typesForDeal(deal: Deal): PropertyType[] {
  return PROPERTY_TYPES.filter((t) => t.ids[deal] !== undefined);
}

// Lookup tables are built once per taxonomy object
const indexCache = new WeakMap<Taxonomy, ReturnType<typeof buildIndex>>();

function buildIndex(taxonomy: Taxonomy) {
  const citiesBySlug: Record<Locale, Map<string, City>> = { ar: new Map(), en: new Map() };
  const regionsBySlug: Record<Locale, Map<string, Region>> = { ar: new Map(), en: new Map() };
  const citiesById = new Map<number, City>();
  const regionsById = new Map<number, Region>();
  const parents = new Map<number, number | null>();
  for (const category of taxonomy.categories) parents.set(category.id, category.parent_id);
  for (const city of taxonomy.cities) {
    citiesById.set(city.id, city);
    for (const locale of LOCALES) citiesBySlug[locale].set(placeSlug(city, locale), city);
  }
  for (const region of taxonomy.regions) {
    regionsById.set(region.id, region);
    for (const locale of LOCALES) regionsBySlug[locale].set(`${region.city_id}/${placeSlug(region, locale)}`, region);
  }
  return { citiesBySlug, regionsBySlug, citiesById, regionsById, parents };
}

export function taxonomyIndex(taxonomy: Taxonomy) {
  let index = indexCache.get(taxonomy);
  if (!index) {
    index = buildIndex(taxonomy);
    indexCache.set(taxonomy, index);
  }
  return index;
}

/** The curated property type a backend category belongs to (walking up its parents). */
export function typeOfCategory(categoryId: number, deal: Deal, taxonomy: Taxonomy): PropertyType | undefined {
  const { parents } = taxonomyIndex(taxonomy);
  const byId = new Map(typesForDeal(deal).map((t) => [t.ids[deal] as number, t]));
  let current: number | null | undefined = categoryId;
  const seen = new Set<number>();
  while (current != null && !seen.has(current)) {
    seen.add(current);
    const type = byId.get(current);
    if (type) return type;
    current = parents.get(current);
  }
  return undefined;
}

/** Whether a backend category is under rentals or sales. */
export function dealOfCategory(categoryId: number, taxonomy: Taxonomy): Deal | undefined {
  const { parents } = taxonomyIndex(taxonomy);
  let current: number | null | undefined = categoryId;
  const seen = new Set<number>();
  while (current != null && !seen.has(current)) {
    seen.add(current);
    if (current === DEALS.rent.id) return "rent";
    if (current === DEALS.sale.id) return "sale";
    current = parents.get(current);
  }
  return undefined;
}

export const BEDROOM_SLUG_SUFFIX = BEDROOM_SUFFIX;

export function dealFromSlug(slug: string, locale: Locale): Deal | undefined {
  return (Object.keys(DEALS) as Deal[]).find((deal) => DEALS[deal].slug[locale] === slug);
}

/** Turns URL segments (already decoded) into listing parameters, or null if they don't form a valid page. */
export function resolveListing(locale: Locale, segments: string[], taxonomy: Taxonomy): ListingParams | null {
  const deal = dealFromSlug(segments[0] ?? "", locale);
  if (!deal) return null;
  const index = taxonomyIndex(taxonomy);
  const params: ListingParams = { deal };
  let i = 1;

  const type = typesForDeal(deal).find((t) => t.slug[locale] === segments[i]);
  if (type) {
    params.type = type;
    i++;
  }
  const city = segments[i] ? index.citiesBySlug[locale].get(segments[i]) : undefined;
  if (city) {
    params.city = city;
    i++;
    const region = segments[i] ? index.regionsBySlug[locale].get(`${city.id}/${segments[i]}`) : undefined;
    if (region) {
      params.region = region;
      i++;
    }
  }
  if (segments[i]) {
    const bedrooms = segments[i].match(new RegExp(`^([1-6])-${BEDROOM_SUFFIX[locale]}$`));
    if (bedrooms && supportsBedrooms(params.type)) {
      params.bedrooms = Number(bedrooms[1]);
      i++;
    } else if (segments[i] === FURNISHED_SLUG[locale] && supportsFurnished(params.deal, params.type)) {
      params.furnished = true;
      i++;
    } else if (supportsRentPeriod(params.deal, params.type)) {
      const period = (Object.keys(RENT_PERIODS) as RentPeriod[]).find((key) => RENT_PERIODS[key].slug[locale] === segments[i]);
      if (period) {
        params.period = period;
        i++;
      }
    }
  }
  return i === segments.length ? params : null;
}

export function listingPath(locale: Locale, params: ListingParams): string {
  const parts = [DEALS[params.deal].slug[locale]];
  if (params.type) parts.push(params.type.slug[locale]);
  if (params.city) parts.push(placeSlug(params.city, locale));
  if (params.city && params.region) parts.push(placeSlug(params.region, locale));
  if (params.bedrooms) parts.push(`${params.bedrooms}-${BEDROOM_SUFFIX[locale]}`);
  else if (params.furnished) parts.push(FURNISHED_SLUG[locale]);
  else if (params.period) parts.push(RENT_PERIODS[params.period].slug[locale]);
  return `${locale === "en" ? "/en" : ""}/${parts.join("/")}`;
}

export function adPath(locale: Locale, ad: { id: number; slug?: string }): string {
  const tail = ad.slug ? `${ad.id}-${ad.slug}` : `${ad.id}`;
  return `${locale === "en" ? "/en" : ""}/${AD_SEGMENT[locale]}/${tail}`;
}

export function homePath(locale: Locale): string {
  return locale === "en" ? "/en" : "/";
}

/** Whether the English version of a listing page can be shown to search engines. */
export function englishIndexable(params: ListingParams): boolean {
  return hasEnglishName(params.city) && hasEnglishName(params.region);
}
