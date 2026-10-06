import type { Metadata } from "next";
import AdRowCard from "@/components/AdRowCard";
import Icon from "@/components/Icon";
import Pagination from "@/components/Pagination";
import SmartSearch from "@/components/SmartSearch";
import { getLanding, getTaxonomy } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/config";
import { type SearchParams, readQuery } from "@/lib/filters";
import { dict } from "@/lib/i18n";
import { placeName, searchPath, taxonomyIndex } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";

export function searchMetadata(locale: Locale): Metadata {
  // Search results repeat listing pages, so they are kept out of search engines
  return { title: dict(locale).search_results, robots: { index: false, follow: true } };
}

const one = (searchParams: SearchParams, key: string) =>
  (Array.isArray(searchParams[key]) ? searchParams[key]?.[0] : searchParams[key]) as string | undefined;

/** Results of a smart search that spans several regions, which no single listing page covers. */
export default async function SearchView({ locale, searchParams }: { locale: Locale; searchParams: SearchParams }) {
  const t = dict(locale);
  const query = readQuery(searchParams);
  const taxonomy = await getTaxonomy();
  const index = taxonomyIndex(taxonomy);

  const id = (key: string) => {
    const value = Number(one(searchParams, key));
    return Number.isSafeInteger(value) && value > 0 ? value : undefined;
  };
  const categoryId = taxonomy.categories.some((c) => c.id === id("cat")) ? id("cat") : undefined;
  const city = id("city") ? index.citiesById.get(id("city") as number) : undefined;
  const regions = (one(searchParams, "regions") ?? "")
    .split(",")
    .map(Number)
    .map((regionId) => index.regionsById.get(regionId))
    .filter((region): region is NonNullable<typeof region> => !!region)
    .slice(0, 50);

  const landing = await getLanding({
    categoryId,
    cityId: city?.id,
    regionIds: regions.map((region) => region.id),
    bedrooms: query.beds,
    bathrooms: query.baths,
    furnished: query.furnished === "yes" ? true : query.furnished === "no" ? false : undefined,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    minArea: query.minArea,
    maxArea: query.maxArea,
    sort: query.sort,
    page: query.page,
  });
  const totalPages = Math.max(1, Math.ceil(landing.total / PAGE_SIZE));

  const pageHref = (page: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      const text = Array.isArray(value) ? value[0] : value;
      if (text && key !== "page") qs.set(key, text);
    }
    if (page > 1) qs.set("page", String(page));
    return `${searchPath(locale)}?${qs.toString()}`;
  };

  const chips = [
    categoryId ? taxonomy.categories.find((c) => c.id === categoryId)?.name : undefined,
    city ? placeName(city, locale) : undefined,
    ...regions.map((region) => placeName(region, locale)),
    query.beds?.length ? `${query.beds.join(", ")} ${t.bedrooms}` : undefined,
    query.maxPrice ? `≤ ${query.maxPrice.toLocaleString("en-US")} ${t.currency}` : undefined,
    query.minPrice ? `≥ ${query.minPrice.toLocaleString("en-US")} ${t.currency}` : undefined,
    query.furnished === "yes" ? t.furnished : query.furnished === "no" ? t.unfurnished : undefined,
  ].filter(Boolean) as string[];

  return (
    <div className="container-page py-8">
      <div className="mx-auto max-w-3xl">
        <SmartSearch
          locale={locale}
          variant="inline"
          initial={query.q ?? ""}
          labels={{ placeholder: t.smart_placeholder, button: t.smart_button, error: t.smart_error, listening: t.smart_listening, examples: [] }}
        />
      </div>

      <header className="mt-8">
        <h1 className="text-2xl font-bold sm:text-[32px]">{t.search_results}</h1>
        <p className="mt-1.5 text-[15px] text-muted">{t.results_count(landing.total)}</p>
        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip} className="rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium text-body">{chip}</li>
            ))}
          </ul>
        )}
      </header>

      {landing.ads.length > 0 ? (
        <>
          <div className="mt-6 space-y-4">
            {landing.ads.map((ad, i) => (
              <AdRowCard key={ad.id} ad={ad} locale={locale} priority={i < 2} />
            ))}
          </div>
          <Pagination locale={locale} page={query.page} totalPages={totalPages} hrefFor={pageHref} />
        </>
      ) : (
        <div className="card mt-6 px-6 py-16 text-center">
          <Icon name="search" size={40} className="mx-auto text-line" />
          <h2 className="mt-4 text-lg font-bold">{t.no_results_title}</h2>
          <p className="mt-2 text-sm text-muted">{t.no_results_body}</p>
        </div>
      )}
    </div>
  );
}
