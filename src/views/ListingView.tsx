import type { Metadata } from "next";
import Link from "next/link";
import AdRowCard from "@/components/AdRowCard";
import AppBand from "@/components/AppBand";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import { ActiveFilters, FilterSidebar, FiltersProvider, SearchRow, SortSelect } from "@/components/filters/ListingFilters";
import { buildListingUrl, categoryPath, facetAttrs } from "@/components/filters/shared";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import Pagination from "@/components/Pagination";
import { getLanding, getTaxonomy } from "@/lib/api";
import { MIN_ADS_TO_INDEX, PAGE_SIZE } from "@/lib/config";
import { type ListingQuery, type SearchParams, filterOptions, isRefined, readQuery, toFilterValue } from "@/lib/filters";
import { formatNumber } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { absolute, listingDescription, listingFaqs, listingHeading, listingJsonLd, listingTitle, pageMetadata, pricesHeading } from "@/lib/seo";
import {
  DEALS,
  FEATURES,
  type Feature,
  PRICE_CAPS,
  PROPERTY_TYPES,
  RENT_PERIODS,
  type ListingParams,
  type RentPeriod,
  categoryIdFor,
  englishIndexable,
  homePath,
  isPlain,
  listingPath,
  placeName,
  pricesPath,
  supportsBedrooms,
  supportsCap,
  supportsPriceGuide,
  supportsFeature,
  supportsFurnished,
  supportsRentPeriod,
  taxonomyIndex,
} from "@/lib/taxonomy";
import type { Locale, Taxonomy } from "@/lib/types";

export type { SearchParams };

/** The page's filters: what its address says plus what the query string adds. */
function pageFilters(locale: Locale, params: ListingParams, query: ListingQuery, taxonomy: Taxonomy) {
  const options = filterOptions(locale, taxonomy);
  const base = categoryIdFor(params);
  // A deeper category is accepted only inside the page's own deal
  const deeper = query.cat !== undefined && categoryPath(options.categories, query.cat, DEALS[params.deal].id).length > 0 ? query.cat : undefined;
  const cat = deeper ?? (params.type ? base : undefined);
  const regionIds = params.region
    ? [params.region.id]
    : params.city
      ? query.regions?.filter((id) => taxonomyIndex(taxonomy).regionsById.get(id)?.city_id === params.city?.id)
      : undefined;
  const value = toFilterValue(DEALS[params.deal].slug[locale], query, {
    cat,
    cityId: params.city?.id,
    regionIds: regionIds?.length ? regionIds : undefined,
    beds: params.bedrooms ? [params.bedrooms] : undefined,
    furnished: params.furnished ? "yes" : undefined,
    period: params.period ? RENT_PERIODS[params.period].option : undefined,
  });
  return { options, value, categoryId: cat ?? base, deeper };
}

function loadLanding(params: ListingParams, query: ListingQuery, filters: ReturnType<typeof pageFilters>) {
  const { value } = filters;
  const severalRegions = (value.regionIds?.length ?? 0) > 1;
  return getLanding({
    categoryId: filters.categoryId,
    cityId: params.city?.id,
    regionId: severalRegions ? undefined : value.regionIds?.[0],
    regionIds: severalRegions ? value.regionIds : undefined,
    bedrooms: value.beds,
    bathrooms: value.baths,
    furnished: params.feature === "unfurnished" ? false : value.furnished === "yes" ? true : value.furnished === "no" ? false : undefined,
    owner: params.feature === "owner",
    instalments: params.feature === "instalments",
    newBuilding: params.feature === "new",
    attrs: [
      ...facetAttrs(value),
      ...(params.feature === "ground" ? ["floor:الطابق الأرضي"] : []),
      ...(params.feature === "first" ? ["floor:1"] : []),
    ],
    minPrice: query.minPrice,
    // A ceiling in the page's address, unless the visitor chose a lower one
    maxPrice: params.cap ? Math.min(params.cap, query.maxPrice ?? params.cap) : query.maxPrice,
    minArea: query.minArea,
    maxArea: query.maxArea,
    sort: query.sort,
    page: query.page,
  });
}

/** Heading of a page narrowed to a category that has no address of its own. */
function categoryHeading(locale: Locale, params: ListingParams, name: string): string {
  const t = dict(locale);
  const deal = DEALS[params.deal].label[locale];
  const place = [params.region, params.city].filter((p): p is NonNullable<typeof p> => !!p).map((p) => placeName(p, locale));
  const where = place.length ? place.join(locale === "en" ? ", " : "، ") : t.jordan;
  const named = /للإيجار|للبيع|for rent|for sale/i.test(name) ? name : `${name} ${deal}`;
  return locale === "en" ? `${named} in ${where}` : `${named} في ${where}`;
}

export async function listingMetadata(locale: Locale, params: ListingParams, searchParams: SearchParams): Promise<Metadata> {
  const query = readQuery(searchParams);
  const filters = pageFilters(locale, params, query, await getTaxonomy());
  const landing = await loadLanding(params, query, filters);
  const leaf = filters.deeper ? landing.breadcrumb[landing.breadcrumb.length - 1] : undefined;
  const heading = leaf ? categoryHeading(locale, params, filters.options.categories.find((c) => c.id === leaf.id)?.name ?? leaf.name) : listingHeading(locale, params);
  const indexable = landing.total >= MIN_ADS_TO_INDEX && !isRefined(query) && (locale === "ar" || englishIndexable(params));
  const title =
    query.page > 1
      ? `${heading} - ${dict(locale).page_of(query.page, Math.max(1, Math.ceil(landing.total / PAGE_SIZE)))}`
      : leaf
        ? heading
        : listingTitle(locale, heading, landing.total);
  return pageMetadata({
    locale,
    title,
    description: listingDescription(locale, params, landing, query.page),
    arPath: listingPath("ar", params),
    enPath: englishIndexable(params) ? listingPath("en", params) : null,
    query: query.page > 1 ? `?page=${query.page}` : "",
    image: landing.ads[0]?.image,
    index: indexable,
  });
}

export default async function ListingView({
  locale,
  params,
  searchParams,
}: {
  locale: Locale;
  params: ListingParams;
  searchParams: SearchParams;
}) {
  const t = dict(locale);
  const query = readQuery(searchParams);
  const taxonomy = await getTaxonomy();
  const filters = pageFilters(locale, params, query, taxonomy);
  const { options, value } = filters;
  const [landing, siblings] = await Promise.all([
    loadLanding(params, query, filters),
    // On a region page, the city-level call provides the neighbouring regions to link to
    value.regionIds?.length ? getLanding({ categoryId: filters.categoryId, cityId: params.city?.id, pageSize: 1 }) : Promise.resolve(null),
  ]);
  const index = taxonomyIndex(taxonomy);
  const chain = categoryPath(options.categories, value.cat, DEALS[params.deal].id);
  const heading = filters.deeper && chain.length ? categoryHeading(locale, params, chain[chain.length - 1].name) : listingHeading(locale, params);
  const totalPages = Math.max(1, Math.ceil(landing.total / PAGE_SIZE));
  const basePath = listingPath(locale, params);

  // Keeps the active refinements when moving between pages
  // Pages whose refinement the filter panel does not know keep their own address between pages
  const ownAddress = !!(params.feature || params.cap) && !isRefined(query);
  const pageHref = (page: number) => (ownAddress ? `${basePath}${page > 1 ? `?page=${page}` : ""}` : buildListingUrl(options, value, page));

  // Breadcrumbs: each level is a real page
  const dealName = locale === "en" ? `${t.properties} ${DEALS[params.deal].label.en}` : `${t.properties} ${DEALS[params.deal].label.ar}`;
  const crumbs: Crumb[] = [
    { name: t.home, path: homePath(locale) },
    { name: dealName, path: listingPath(locale, { deal: params.deal }) },
  ];
  if (filters.deeper) {
    // Every level of the category tree, each one a page of its own
    for (const category of chain) crumbs.push({ name: category.name, path: buildListingUrl(options, { deal: value.deal, cat: category.id }) });
  } else if (params.type) crumbs.push({ name: params.type.label[locale], path: listingPath(locale, { deal: params.deal, type: params.type }) });
  if (params.city) crumbs.push({ name: placeName(params.city, locale), path: listingPath(locale, { deal: params.deal, type: params.type, city: params.city }) });
  if (params.region) crumbs.push({ name: placeName(params.region, locale), path: listingPath(locale, { deal: params.deal, type: params.type, city: params.city, region: params.region }) });
  if (params.bedrooms || params.furnished) crumbs.push({ name: params.bedrooms ? `${params.bedrooms} ${t.bedrooms}` : t.furnished, path: basePath });
  if (params.period) crumbs.push({ name: RENT_PERIODS[params.period].label[locale], path: basePath });
  if (params.feature || params.cap) crumbs.push({ name: heading, path: basePath });

  // Narrower pages of the same place: each is a page of its own that search engines can reach from here
  const plain = isPlain(params) && !filters.deeper;
  const narrower: { name: string; count: number; href: string }[] = [];
  if (plain && params.type) {
    const counts = landing.refinements;
    const narrow = (extra: Partial<ListingParams>, count: number) => {
      const next = { ...params, ...extra };
      if (count >= MIN_ADS_TO_INDEX) narrower.push({ name: listingHeading(locale, next), count, href: listingPath(locale, next) });
    };
    if (counts && supportsFurnished(params.deal, params.type)) narrow({ furnished: true }, counts.furnished);
    if (counts && supportsRentPeriod(params.deal, params.type)) {
      for (const period of Object.keys(RENT_PERIODS) as RentPeriod[]) narrow({ period }, counts[period]);
    }
    if (supportsBedrooms(params.type)) for (const { value, count } of landing.bedrooms) narrow({ bedrooms: value }, count);
    for (const feature of Object.keys(FEATURES) as Feature[]) {
      if (counts && supportsFeature(feature, params.deal, params.type)) narrow({ feature }, counts[feature] ?? 0);
    }
    if (counts?.caps && supportsCap(params.type)) {
      for (const cap of PRICE_CAPS[params.deal]) narrow({ cap }, counts.caps[String(cap)] ?? 0);
    }
  }

  const nearby = siblings ? siblings.locations : landing.locations;
  const placeLinks = nearby
    .map((place) => {
      const region = params.city ? index.regionsById.get(place.id) : undefined;
      const city = params.city ?? index.citiesById.get(place.id);
      if (!city || (params.city && !region)) return null;
      if (region && params.region && region.id === params.region.id) return null;
      return {
        id: place.id,
        name: placeName(region ?? city, locale),
        count: place.count,
        href: buildListingUrl(options, { deal: value.deal, cat: value.cat, cityId: city.id, regionIds: region ? [region.id] : undefined }),
      };
    })
    .filter((link): link is NonNullable<typeof link> => link !== null);

  // The other kinds of property in the same place, so every page of a place leads to the rest of it
  const related: { name: string; count: number; href: string }[] = [];
  if (plain) {
    const counts = new Map((landing.category_counts ?? []).map((entry) => [entry.id, entry.count]));
    for (const type of PROPERTY_TYPES) {
      const id = type.ids[params.deal];
      const count = id !== undefined ? counts.get(id) ?? 0 : 0;
      if (type.key === params.type?.key || count < MIN_ADS_TO_INDEX) continue;
      const next: ListingParams = { deal: params.deal, type, city: params.city, region: params.region };
      related.push({ name: listingHeading(locale, next), count, href: listingPath(locale, next) });
    }
    related.sort((a, b) => b.count - a.count);
  }

  const refined = isRefined(query);
  const faqs = query.page === 1 && !refined ? listingFaqs(locale, params, landing) : [];
  const placeScope = params.city ? placeName(params.city, locale) : t.jordan;

  return (
    <FiltersProvider
      options={options}
      // Ad counts for the location search: areas of the chosen city, otherwise cities
      popular={nearby.map((place) => ({ id: place.id, count: place.count }))}
      categoryCounts={landing.category_counts ?? []}
      value={value}
    >
      <SearchRow />

      {/* A soft canvas with white panels: the filter panel and the results share one top line and one gap */}
      <div className="bg-surface">
        <div className="container-page pb-16 pt-6">
          <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* In Arabic the first column sits on the right, so the filter panel is on the right */}
            <FilterSidebar />

            <div className="min-w-0 space-y-5">
              <header className="rounded-2xl border border-line bg-white px-5 py-3.5 shadow-card sm:px-6">
                <Breadcrumbs items={crumbs} label={t.home} />
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold leading-snug sm:text-2xl">{heading}</h1>
                    <p className="text-sm text-muted">
                      <span className="font-bold text-ink">{formatNumber(landing.total)}</span> {t.results_in}
                    </p>
                  </div>
                  <SortSelect />
                </div>
                <ActiveFilters />
                {/* The typical price of every area, for this kind of property in this city */}
                {plain && !params.region && params.type && supportsPriceGuide(params.deal, params.type) && landing.total >= 30 && (
                  <Link
                    href={pricesPath(locale, { deal: params.deal, type: params.type, city: params.city })}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline"
                  >
                    <Icon name="chart" size={16} />
                    {pricesHeading(locale, { deal: params.deal, type: params.type, city: params.city })}
                  </Link>
                )}
              </header>

              {query.q && (
                <p className="flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-3.5 text-sm leading-6 text-brand-900">
                  <Icon name="sparkle" size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>
                    <span className="font-bold">{t.search_for}</span>
                    <span className="mx-2 text-brand-200">|</span>
                    <span dir="auto">{query.q}</span>
                  </span>
                </p>
              )}

              {landing.ads.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {landing.ads.map((ad, i) => (
                      <AdRowCard key={ad.id} ad={ad} locale={locale} priority={i < 2} />
                    ))}
                  </div>
                  <Pagination locale={locale} page={query.page} totalPages={totalPages} hrefFor={pageHref} />
                </>
              ) : (
                <div className="rounded-2xl border border-line bg-white px-6 py-16 text-center shadow-card">
                  <Icon name="search" size={40} className="mx-auto text-line" />
                  <h2 className="mt-4 text-lg font-bold">{t.no_results_title}</h2>
                  <p className="mt-2 text-sm text-muted">{t.no_results_body}</p>
                  <Link href={listingPath(locale, { deal: params.deal, type: params.type })} className="btn-primary mt-6">
                    {params.type ? `${params.type.label[locale]} ${DEALS[params.deal].label[locale]}` : dealName}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-page pb-6">
        {/* Links to neighbouring pages, for visitors and for search engines */}
        {placeLinks.length > 0 && (
          <nav className="mt-12" aria-labelledby="places-title">
            <h2 id="places-title" className="section-title">
              {params.city ? t.browse_areas(placeScope) : t.browse_by_city}
            </h2>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5">
              {placeLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="flex items-center justify-between gap-2 border-b border-line py-2.5 text-sm text-body transition hover:text-brand-600">
                    <span className="truncate">{link.name}</span>
                    <span className="shrink-0 text-xs text-muted">{formatNumber(link.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {narrower.length > 0 && query.page === 1 && !refined && (
          <nav className="mt-12" aria-labelledby="narrower-title">
            <h2 id="narrower-title" className="section-title">
              {locale === "en" ? "Narrow your search" : "عمليات بحث شائعة"}
            </h2>
            <ul className="mt-5 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {narrower.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex items-center justify-between gap-2 border-b border-line py-2.5 text-sm text-body transition hover:text-brand-600">
                    <span className="truncate">{link.name}</span>
                    <span className="shrink-0 text-xs text-muted">{formatNumber(link.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {related.length > 0 && query.page === 1 && !refined && (
          <nav className="mt-12" aria-labelledby="related-title">
            <h2 id="related-title" className="section-title">
              {t.related_title(params.region ? placeName(params.region, locale) : placeScope)}
            </h2>
            <ul className="mt-5 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex items-center justify-between gap-2 border-b border-line py-2.5 text-sm text-body transition hover:text-brand-600">
                    <span className="truncate">{link.name}</span>
                    <span className="shrink-0 text-xs text-muted">{formatNumber(link.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <Faq title={t.faq_title} faqs={faqs} />
        <AppBand locale={locale} />
        {landing.ads.length > 0 && (
          <JsonLd data={listingJsonLd(locale, heading, landing, params, absolute(basePath) + (query.page > 1 ? `?page=${query.page}` : ""))} />
        )}
      </div>
    </FiltersProvider>
  );
}
