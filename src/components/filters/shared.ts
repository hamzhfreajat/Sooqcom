/** Types and helpers shared by the listing filters. Plain module: used on the server and in the browser. */

export type Lang = "ar" | "en";
export type Furnishing = "yes" | "no" | "partial";

export interface FilterValue {
  /** Deal slug as it appears in the address ("للإيجار", "rent") */
  deal: string;
  /** Category at any level of the tree; empty means everything under the deal */
  cat?: number;
  cityId?: number;
  /** One area lives in the address; several go in the query string */
  regionIds?: number[];
  beds?: number[];
  baths?: number[];
  furnished?: Furnishing;
  min?: number;
  max?: number;
  amin?: number;
  amax?: number;
  sort?: string;
  /** Attribute filters: facet key -> chosen option numbers (1-based) */
  facets?: Record<string, number[]>;
}

export type CategoryKind = "residential" | "commercial" | "land" | "shared" | "farm" | "leisure" | "any";

export interface CategoryOption {
  id: number;
  parentId: number | null;
  name: string;
  /** Set when the category has its own page address (/للإيجار/شقق) */
  slug?: string;
  /** Whether "3-bedrooms" can be part of this category's page address */
  bedsInPath?: boolean;
  /** Whether "furnished" can be part of this category's rental page address */
  furnishedInPath?: boolean;
  /** Whether "daily" / "monthly" can be part of this category's rental page address */
  periodInPath?: boolean;
}

export interface PlaceOption {
  id: number;
  slug: string;
  name: string;
}

export interface RegionOption extends PlaceOption {
  cityId: number;
}

export interface FilterOptions {
  locale: Lang;
  /** "" for Arabic, "/en" for English */
  prefix: string;
  bedroomSuffix: string;
  furnishedSlug: string;
  /** Rent periods with a page of their own: number of the "dur" option -> address part */
  periodSlugs: Record<number, string>;
  deals: { slug: string; label: string; rootId: number }[];
  rentDeal: string;
  categories: CategoryOption[];
  cities: PlaceOption[];
  regions: RegionOption[];
  labels: FilterLabels;
}

export interface FilterLabels {
  filters: string; location: string; locationPlaceholder: string; cities: string; popularIn: string; noMatch: string;
  city: string; type: string; anyType: string; price: string; perMonth: string; from: string; to: string; upTo: string;
  thousand: string; beds: string; baths: string; any: string; studio: string; furnishing: string; furnished: string;
  unfurnished: string; partlyFurnished: string; area: string; apply: string; clear: string; showResults: string;
  sort: string; newest: string; priceAsc: string; priceDesc: string; currency: string; sqm: string; close: string;
  clearLocation: string; allJordan: string; areasOf: string; allOf: string; changeCity: string; areasCount: string;
  searchArea: string; otherPlaces: string; category: string; all: string; typeOf: string; remove: string;
  activeFilters: string; bedsUnit: string; bathsUnit: string; selected: string; showAll: string; clearOne: string;
  anyPrice: string; minimum: string; maximum: string;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const KIND_ROOTS: Record<number, CategoryKind> = {
  310: "residential", 10310: "residential",
  311: "commercial", 10311: "commercial",
  10313: "land",
  306: "shared",
  314: "farm", 10314: "farm",
  315: "leisure", 316: "leisure", 10315: "leisure",
};
const STUDIO_IDS = new Set([302, 10302]);
const HOUSE_IDS = new Set([3101, 3102, 10101, 10102]);

const indexCache = new WeakMap<CategoryOption[], Map<number, CategoryOption>>();

export function categoryIndex(categories: CategoryOption[]): Map<number, CategoryOption> {
  let index = indexCache.get(categories);
  if (!index) {
    index = new Map(categories.map((category) => [category.id, category]));
    indexCache.set(categories, index);
  }
  return index;
}

/** The category and its parents, from the top level (just under the deal) down to the category itself. */
export function categoryPath(categories: CategoryOption[], id: number | undefined, rootId: number): CategoryOption[] {
  const index = categoryIndex(categories);
  const path: CategoryOption[] = [];
  let current = id !== undefined ? index.get(id) : undefined;
  while (current && current.id !== rootId && path.length < 8) {
    path.unshift(current);
    current = current.parentId !== null ? index.get(current.parentId) : undefined;
  }
  // A category that does not lead up to this deal is not valid here
  return current?.id === rootId ? path : [];
}

export function childCategories(categories: CategoryOption[], parentId: number): CategoryOption[] {
  return categories.filter((category) => category.parentId === parentId);
}

export interface CategoryTraits {
  kind: CategoryKind;
  studio: boolean;
  house: boolean;
}

export function categoryTraits(path: CategoryOption[]): CategoryTraits {
  const kind = path.map((category) => KIND_ROOTS[category.id]).find(Boolean) ?? "any";
  return {
    kind,
    studio: path.some((category) => STUDIO_IDS.has(category.id)),
    house: path.some((category) => HOUSE_IDS.has(category.id)),
  };
}

// ---------------------------------------------------------------------------
// Attribute filters (the same lists the app offers)
// ---------------------------------------------------------------------------
type Text = Record<Lang, string>;
const o = (ar: string, en: string): { value: string; label: Text } => ({ value: ar, label: { ar, en } });

export interface Facet {
  /** Short name used in the address (?floor=2,3) */
  key: string;
  /** Name of the attribute on the API side */
  api: string;
  label: Text;
  options: { value: string; label: Text }[];
  show: (traits: CategoryTraits, isRent: boolean) => boolean;
}

const homes = (t: CategoryTraits) => t.kind !== "land";
const living = (t: CategoryTraits) => t.kind !== "land" && t.kind !== "commercial";
const land = (t: CategoryTraits) => t.kind === "land";

const FACADES = [
  o("شمالية", "North"), o("جنوبية", "South"), o("شرقية", "East"), o("غربية", "West"),
  o("شمالية شرقية", "North-east"), o("شمالية غربية", "North-west"), o("جنوبية شرقية", "South-east"), o("جنوبية غربية", "South-west"),
];
const YES_NO = [o("نعم", "Yes"), o("لا", "No")];

export const FACETS: Facet[] = [
  {
    key: "floor", api: "floor", label: { ar: "الطابق", en: "Floor" },
    show: (t) => homes(t) && !t.house && t.kind !== "farm",
    options: [
      o("طابق التسوية", "Basement"), o("طابق شبه أرضي", "Semi-ground"), o("الطابق الأرضي", "Ground"),
      o("1", "1"), o("2", "2"), o("3", "3"), o("4", "4"), o("5", "5"), o("6", "6"), o("7", "7"),
      o("طابق أخير", "Top floor"), o("روف", "Roof"), o("طابق أخير مع روف", "Top floor with roof"),
    ],
  },
  {
    key: "dur", api: "rent_duration", label: { ar: "مدة الإيجار", en: "Rent period" },
    show: (t, isRent) => isRent && homes(t),
    options: [
      o("يومي", "Daily"), o("أسبوعي", "Weekly"), o("شهري", "Monthly"), o("كل 3 أشهر", "Every 3 months"),
      o("كل أربع أشهر", "Every 4 months"), o("كل 5 أشهر", "Every 5 months"), o("كل 6 أشهر", "Every 6 months"), o("سنوي", "Yearly"),
    ],
  },
  {
    key: "age", api: "age", label: { ar: "عمر البناء", en: "Building age" },
    show: (t) => homes(t) && t.kind !== "farm",
    options: [
      o("0 - 11 شهر", "Under 1 year"), o("1 - 5 سنوات", "1 - 5 years"), o("6 - 9 سنوات", "6 - 9 years"),
      o("10 - 19 سنوات", "10 - 19 years"), o("+20 سنة", "20+ years"),
    ],
  },
  {
    key: "feat", api: "main_features", label: { ar: "المزايا الرئيسية", en: "Main features" },
    show: living,
    options: [
      o("تكييف مركزي", "Central A/C"), o("تدفئة", "Heating"), o("شرفة / بلكونة", "Balcony"), o("غرفة خادمة", "Maid's room"),
      o("غرفة غسيل", "Laundry room"), o("خزائن حائط", "Built-in wardrobes"), o("مسبح خاص", "Private pool"),
      o("سخان شمسي", "Solar heater"), o("زجاج شبابيك مزدوج", "Double glazing"), o("مناسبة لعرسان", "For newlyweds"),
      o("كراج", "Garage"), o("سوبر ديلوكس", "Super deluxe"),
    ],
  },
  {
    key: "extra", api: "extra_features", label: { ar: "المزايا الإضافية والمرافق", en: "Building amenities" },
    show: homes,
    options: [
      o("يوجد مصعد", "Lift"), o("موقف سيارات", "Parking"), o("حارس / أمن وحماية", "Guard / security"),
      o("نظام كهرباء احتياطي للطوارئ", "Backup power"), o("انتركم", "Intercom"), o("حديقة", "Garden"),
      o("منطقة شواء", "Barbecue area"), o("بركة سباحة", "Swimming pool"),
    ],
  },
  { key: "facade", api: "facade", label: { ar: "الواجهة", en: "Facing" }, show: () => true, options: FACADES },
  {
    key: "pay", api: "payment_method", label: { ar: "طريقة الدفع", en: "Payment" },
    show: (t, isRent) => living(t) && !isRent,
    options: [o("كاش", "Cash"), o("أقساط", "Instalments"), o("كاش أو أقساط", "Cash or instalments")],
  },
  {
    key: "near", api: "nearby", label: { ar: "مواقع قريبة", en: "Nearby" },
    show: homes,
    options: [
      o("بنك / صراف آلي", "Bank / ATM"), o("دراي كلين", "Dry cleaner"), o("سوبر ماركت", "Supermarket"),
      o("صالة رياضية / جيم", "Gym"), o("صيدلية", "Pharmacy"), o("محطة باصات", "Bus stop"), o("مدرسة", "School"),
      o("مستشفى", "Hospital"), o("مسجد", "Mosque"), o("مطعم", "Restaurant"), o("جامعة", "University"),
    ],
  },
  {
    key: "zoning", api: "zoning_classification", label: { ar: "تصنيف التنظيم", en: "Zoning" }, show: land,
    options: [
      o("سكن أ", "Residential A"), o("سكن ب", "Residential B"), o("سكن ج", "Residential C"), o("سكن د", "Residential D"),
      o("تجاري", "Commercial"), o("زراعي", "Agricultural"), o("صناعي", "Industrial"), o("أخرى", "Other"),
    ],
  },
  {
    key: "ltype", api: "land_type", label: { ar: "نوع الأرض", en: "Land type" }, show: land,
    options: [
      o("سكنية", "Residential"), o("زراعية", "Agricultural"), o("استثمارية", "Investment"), o("تجارية", "Commercial"),
      o("سياحية", "Tourism"), o("صناعية", "Industrial"),
    ],
  },
  {
    key: "shape", api: "geometric_shape", label: { ar: "الشكل الهندسي", en: "Plot shape" }, show: land,
    options: [o("مستطيل", "Rectangular"), o("مربع", "Square"), o("غير منتظم", "Irregular"), o("زاوية / شارعَين", "Corner / two streets")],
  },
  {
    key: "topo", api: "topography", label: { ar: "طبيعة الأرض", en: "Terrain" }, show: land,
    options: [o("مستوية", "Flat"), o("منحدرة", "Sloping"), o("جبلية", "Mountainous"), o("مرتفعة", "Elevated")],
  },
  {
    key: "services", api: "available_services", label: { ar: "الخدمات", en: "Services" }, show: land,
    options: [o("ماء", "Water"), o("كهرباء", "Electricity"), o("صرف صحي", "Sewage"), o("إنترنت", "Internet"), o("شوارع معبدة", "Paved roads")],
  },
  {
    key: "own", api: "ownership_type", label: { ar: "نوع الملكية", en: "Ownership" }, show: land,
    options: [o("ملك", "Freehold"), o("تفويض", "Delegation"), o("أخرى", "Other")],
  },
  { key: "mortgage", api: "is_mortgaged", label: { ar: "تخضع للرهن؟", en: "Mortgaged?" }, show: land, options: YES_NO },
  { key: "inst", api: "installment_possible", label: { ar: "متاح بالأقساط؟", en: "Instalments available?" }, show: land, options: YES_NO },
];

const PARTLY_FURNISHED = "مفروش جزئياً";

/** The API's attribute filters ("name:value") for the chosen facets. */
export function facetAttrs(v: Pick<FilterValue, "facets" | "furnished">): string[] {
  const attrs: string[] = [];
  for (const facet of FACETS) {
    for (const number of v.facets?.[facet.key] ?? []) {
      const option = facet.options[number - 1];
      if (option) attrs.push(`${facet.api}:${option.value}`);
    }
  }
  if (v.furnished === "partial") attrs.push(`furnished:${PARTLY_FURNISHED}`);
  return attrs;
}

/** Which filters make sense for the chosen category. */
export function filterScope(options: FilterOptions, v: FilterValue) {
  const rootId = options.deals.find((deal) => deal.slug === v.deal)?.rootId ?? 0;
  const path = categoryPath(options.categories, v.cat, rootId);
  const traits = categoryTraits(path);
  const isRent = v.deal === options.rentDeal;
  const rooms = traits.kind !== "land" && traits.kind !== "commercial";
  return {
    rootId,
    path,
    traits,
    isRent,
    beds: rooms && !traits.studio,
    baths: rooms,
    furnishing: traits.kind !== "land",
    facets: FACETS.filter((facet) => facet.show(traits, isRent)),
  };
}

/** Drops the choices that do not apply to the (new) category, e.g. bedrooms on land. */
export function pruneFilters(options: FilterOptions, v: FilterValue): FilterValue {
  const scope = filterScope(options, v);
  const allowed = new Set(scope.facets.map((facet) => facet.key));
  const facets = Object.fromEntries(Object.entries(v.facets ?? {}).filter(([key, values]) => allowed.has(key) && values.length > 0));
  return {
    ...v,
    beds: scope.beds ? v.beds : undefined,
    baths: scope.baths ? v.baths : undefined,
    furnished: scope.furnishing ? v.furnished : undefined,
    facets: Object.keys(facets).length ? facets : undefined,
  };
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
/** The address of the listing page for a set of filters. Mirrors `listingPath` on the server. */
export function buildListingUrl(options: FilterOptions, v: FilterValue, page = 1): string {
  const index = categoryIndex(options.categories);
  const category = v.cat !== undefined ? index.get(v.cat) : undefined;
  // The nearest level that has its own address; deeper levels ride along as ?cat=
  let addressed = category;
  while (addressed && !addressed.slug) addressed = addressed.parentId !== null ? index.get(addressed.parentId) : undefined;
  const exact = !!category && addressed?.id === category.id;

  const city = v.cityId ? options.cities.find((c) => c.id === v.cityId) : undefined;
  const regionIds = city ? (v.regionIds ?? []).filter((id) => options.regions.some((r) => r.id === id && r.cityId === city.id)) : [];
  const region = regionIds.length === 1 ? options.regions.find((r) => r.id === regionIds[0]) : undefined;
  const parts = [v.deal, addressed?.slug, city?.slug, region?.slug];

  // One refinement can live in the address; the rest go in the query string
  const beds = v.beds ?? [];
  const bedsInPath = exact && !!addressed?.bedsInPath && beds.length === 1 && beds[0] >= 1 && beds[0] <= 6;
  if (bedsInPath) parts.push(`${beds[0]}-${options.bedroomSuffix}`);
  const isRent = v.deal === options.rentDeal;
  const furnishedInPath = !bedsInPath && isRent && exact && !!addressed?.furnishedInPath && v.furnished === "yes";
  if (furnishedInPath) parts.push(options.furnishedSlug);
  const periods = v.facets?.dur ?? [];
  const periodSlug = periods.length === 1 ? options.periodSlugs[periods[0]] : undefined;
  const periodInPath = !bedsInPath && !furnishedInPath && isRent && exact && !!addressed?.periodInPath && !!periodSlug;
  if (periodInPath) parts.push(periodSlug as string);

  const query = new URLSearchParams();
  if (category && !exact) query.set("cat", String(category.id));
  if (regionIds.length > 1) query.set("regions", regionIds.join(","));
  if (beds.length && !bedsInPath) query.set("beds", beds.join(","));
  if (v.baths?.length) query.set("baths", v.baths.join(","));
  if (v.furnished && !furnishedInPath) query.set("furn", v.furnished === "yes" ? "1" : v.furnished === "no" ? "0" : "p");
  if (v.min) query.set("min", String(v.min));
  if (v.max) query.set("max", String(v.max));
  if (v.amin) query.set("amin", String(v.amin));
  if (v.amax) query.set("amax", String(v.amax));
  for (const facet of FACETS) {
    const chosen = v.facets?.[facet.key];
    if (chosen?.length && !(facet.key === "dur" && periodInPath)) query.set(facet.key, chosen.join(","));
  }
  if (v.sort && v.sort !== "newest") query.set("sort", v.sort);
  if (page > 1) query.set("page", String(page));
  // Commas are safe in a query string and keep the address readable
  const qs = query.toString().replace(/%2C/g, ",");
  return `${options.prefix}/${parts.filter(Boolean).join("/")}${qs ? `?${qs}` : ""}`;
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Reads a number typed with Western, Arabic-Indic or Persian digits (and separators). */
export function parseNumber(text: string): number | undefined {
  const western = text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const index = ARABIC_DIGITS.indexOf(digit);
    return String(index >= 0 ? index : PERSIAN_DIGITS.indexOf(digit));
  });
  const value = Number(western.replace(/[^\d]/g, ""));
  return value > 0 ? value : undefined;
}

/** Folds spelling variants so "الجبيهه" finds "الجبيهة" and "ابو" finds "أبو". */
export function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tells the progress bar at the top of the page that a navigation has started. */
export function announceNavigation() {
  window.dispatchEvent(new Event("sq:navigate"));
}

/** Adds the value to the list, or removes it when it is already there. */
export function toggle(list: number[] | undefined, value: number): number[] | undefined {
  const current = list ?? [];
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort((a, b) => a - b);
  return next.length ? next : undefined;
}

export interface ActiveChip {
  key: string;
  label: string;
  /** The filters once this chip is removed */
  without: FilterValue;
}

/** Every applied filter as a removable chip, in the order the filters appear on the page. */
export function activeChips(options: FilterOptions, v: FilterValue): ActiveChip[] {
  const L = options.labels;
  const lang = options.locale;
  const chips: ActiveChip[] = [];
  const scope = filterScope(options, v);
  const number = (value: number) => value.toLocaleString("en-US");

  const leaf = scope.path[scope.path.length - 1];
  if (leaf) {
    const parent = scope.path[scope.path.length - 2];
    chips.push({ key: "cat", label: leaf.name, without: pruneFilters(options, { ...v, cat: parent?.id }) });
  }
  const city = options.cities.find((c) => c.id === v.cityId);
  const regions = (v.regionIds ?? []).map((id) => options.regions.find((r) => r.id === id)).filter((r): r is RegionOption => !!r);
  if (city && regions.length === 0) chips.push({ key: "city", label: city.name, without: { ...v, cityId: undefined, regionIds: undefined } });
  for (const region of regions) {
    const rest = (v.regionIds ?? []).filter((id) => id !== region.id);
    chips.push({ key: `r${region.id}`, label: city ? `${region.name}، ${city.name}` : region.name, without: { ...v, regionIds: rest.length ? rest : undefined } });
  }
  if (v.min || v.max) {
    const label = v.min && v.max ? `${number(v.min)} - ${number(v.max)}` : v.max ? `${L.upTo} ${number(v.max)}` : `${L.from} ${number(v.min as number)}`;
    chips.push({ key: "price", label: `${label} ${L.currency}`, without: { ...v, min: undefined, max: undefined } });
  }
  if (v.amin || v.amax) {
    const label = v.amin && v.amax ? `${number(v.amin)} - ${number(v.amax)}` : v.amax ? `${L.upTo} ${number(v.amax)}` : `${L.from} ${number(v.amin as number)}`;
    chips.push({ key: "area", label: `${label} ${L.sqm}`, without: { ...v, amin: undefined, amax: undefined } });
  }
  for (const beds of v.beds ?? []) {
    chips.push({ key: `beds${beds}`, label: beds === 0 ? L.studio : `${beds === 6 ? "6+" : beds} ${L.bedsUnit}`, without: { ...v, beds: toggle(v.beds, beds) } });
  }
  for (const baths of v.baths ?? []) {
    chips.push({ key: `baths${baths}`, label: `${baths === 6 ? "6+" : baths} ${L.bathsUnit}`, without: { ...v, baths: toggle(v.baths, baths) } });
  }
  if (v.furnished) {
    const label = v.furnished === "yes" ? L.furnished : v.furnished === "no" ? L.unfurnished : L.partlyFurnished;
    chips.push({ key: "furn", label, without: { ...v, furnished: undefined } });
  }
  for (const facet of FACETS) {
    for (const chosen of v.facets?.[facet.key] ?? []) {
      const option = facet.options[chosen - 1];
      if (!option) continue;
      const rest = toggle(v.facets?.[facet.key], chosen);
      const facets = { ...v.facets };
      if (rest) facets[facet.key] = rest;
      else delete facets[facet.key];
      // A bare number or yes/no means nothing without the filter's name
      const bare = /^\d+$/.test(option.value) || option.value === "نعم" || option.value === "لا";
      chips.push({
        key: `${facet.key}${chosen}`,
        label: bare ? `${facet.label[lang]}: ${option.label[lang]}` : option.label[lang],
        without: { ...v, facets: Object.keys(facets).length ? facets : undefined },
      });
    }
  }
  return chips;
}

/** How many refinements are applied in the filter panel (location and category are counted apart). */
export function panelFilterCount(v: FilterValue): number {
  return (
    (v.beds?.length ?? 0) +
    (v.baths?.length ?? 0) +
    (v.furnished ? 1 : 0) +
    (v.min || v.max ? 1 : 0) +
    (v.amin || v.amax ? 1 : 0) +
    Object.values(v.facets ?? {}).reduce((sum, values) => sum + values.length, 0)
  );
}
