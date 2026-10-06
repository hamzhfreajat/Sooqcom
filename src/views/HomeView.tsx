import type { Metadata } from "next";
import Link from "next/link";
import AdCardView from "@/components/AdCardView";
import AppBand from "@/components/AppBand";
import HeroSearch from "@/components/HeroSearch";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import SmartSearch from "@/components/SmartSearch";
import { getLanding, getSitemapLanding, getTaxonomy } from "@/lib/api";
import { adLocation, formatNumber, formatPrice } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { organizationJsonLd, pageMetadata, pricesHeading, websiteJsonLd } from "@/lib/seo";
import { DEALS, adPath, hasEnglishName, listingPath, placeName, placeSlug, pricesPath, taxonomyIndex, typeOfCategory, typesForDeal } from "@/lib/taxonomy";
import type { AdCard, Deal, Locale } from "@/lib/types";

export function homeMetadata(locale: Locale): Metadata {
  const t = dict(locale);
  return pageMetadata({ locale, title: t.home_title, absoluteTitle: true, description: t.home_description, arPath: "/", enPath: "/en" });
}

const AMMAN_ID = 5;

function HeroPhoto({ ad, locale }: { ad: AdCard; locale: Locale }) {
  return (
    <Link href={adPath(locale, ad)} tabIndex={-1} className="group relative block overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lift">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ad.image as string} alt={ad.title} loading="eager" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-3.5 pt-10">
        <span className="block text-lg font-bold text-white">{formatPrice(ad.price, locale)}</span>
        <span className="block truncate text-sm text-white/75">{adLocation(ad, locale)}</span>
      </span>
    </Link>
  );
}
const WHY_ICONS = ["chart", "refresh", "star"];

export default async function HomeView({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const apartments = typesForDeal("rent")[0];
  const [taxonomy, counts, latestRent, latestSale, ammanRent] = await Promise.all([
    getTaxonomy(),
    getSitemapLanding(),
    getLanding({ categoryId: DEALS.rent.id, pageSize: 12 }),
    getLanding({ categoryId: DEALS.sale.id, pageSize: 12 }),
    getLanding({ categoryId: apartments.ids.rent, cityId: AMMAN_ID, pageSize: 1 }),
  ]);
  const index = taxonomyIndex(taxonomy);

  // Ads per curated type and per city, from the same counts the sitemap uses
  const typeCounts: Record<Deal, Map<string, number>> = { rent: new Map(), sale: new Map() };
  const cityCounts = new Map<number, number>();
  for (const row of counts) {
    for (const deal of ["rent", "sale"] as Deal[]) {
      const type = typeOfCategory(row.category_id, deal, taxonomy);
      if (type) typeCounts[deal].set(type.key, (typeCounts[deal].get(type.key) ?? 0) + row.count);
    }
    if (row.city_id != null) cityCounts.set(row.city_id, (cityCounts.get(row.city_id) ?? 0) + row.count);
  }

  const cities = taxonomy.cities
    .map((city) => ({ city, count: cityCounts.get(city.id) ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
  const amman = index.citiesById.get(AMMAN_ID);
  const ammanAreas = amman
    ? ammanRent.locations
        .map((place) => ({ region: index.regionsById.get(place.id), count: place.count }))
        .filter((entry) => entry.region && (locale === "ar" || hasEnglishName(entry.region)))
        .slice(0, 12)
    : [];

  // Four recent listings with photos, mixed from rent and sale, for the hero
  const heroAds = [...latestRent.ads.slice(0, 2), ...latestSale.ads.slice(0, 2)].filter((ad) => ad.image);

  const dealHeading = (deal: Deal) =>
    locale === "en" ? `${t.properties} ${DEALS[deal].label.en}` : `${t.properties} ${DEALS[deal].label.ar}`;

  return (
    <>
      {/* The backdrop grows out of the white navigation bar: white at the top edge, deepening to the app's
          sky blue behind the headline, then fading back into the white page */}
      <section className="relative overflow-hidden bg-[linear-gradient(to_bottom,#ffffff_0%,#b9d5fb_7%,#7fb0f6_22%,#5f9cf3_46%,#8ab8f7_72%,#ffffff_100%)]">
        <div className="pointer-events-none absolute -top-48 start-[12%] h-[460px] w-[640px] rounded-full bg-white/15 blur-[110px]" />
        <div className="pointer-events-none absolute -top-24 end-[4%] h-[380px] w-[520px] rounded-full bg-brand-500/20 blur-[120px]" />

        <div className="container-page relative grid gap-12 pb-28 pt-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-card backdrop-blur">
              <Icon name="sparkle" size={15} />
              {t.smart_title}
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.15] text-ink sm:text-[56px]">{t.hero_title}</h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-ink/80 sm:text-lg">{t.hero_subtitle}</p>
            <div className="mt-8 max-w-2xl">
              <SmartSearch
                locale={locale}
                labels={{ placeholder: t.smart_placeholder, button: t.smart_button, error: t.smart_error, listening: t.smart_listening, examples: t.smart_examples }}
              />
            </div>
          </div>

          {/* Real listings, not stock photos */}
          {heroAds.length >= 3 && (
            <div className="hidden grid-cols-2 gap-4 lg:grid" aria-hidden="true">
              <div className="space-y-4 pt-10">
                {heroAds.slice(0, 2).map((ad) => <HeroPhoto key={ad.id} ad={ad} locale={locale} />)}
              </div>
              <div className="space-y-4">
                {heroAds.slice(2, 4).map((ad) => <HeroPhoto key={ad.id} ad={ad} locale={locale} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container-page">
        <div className="relative -mt-14">
          <p className="mb-2 text-sm font-semibold text-body">{t.or_filters}</p>
          <HeroSearch
            action={locale === "en" ? "/en" : ""}
            deals={(["rent", "sale"] as Deal[]).map((deal) => ({ value: DEALS[deal].slug[locale], label: dealHeading(deal) }))}
            types={Object.fromEntries(
              (["rent", "sale"] as Deal[]).map((deal) => [
                DEALS[deal].slug[locale],
                typesForDeal(deal).map((type) => ({ value: type.slug[locale], label: type.label[locale] })),
              ]),
            )}
            cities={cities.map(({ city }) => ({ value: placeSlug(city, locale), label: placeName(city, locale) }))}
            labels={{ deal: t.search_deal, type: t.search_type, city: t.search_city, anyType: t.any_type, allJordan: t.all_jordan, search: t.search }}
          />
        </div>

        {(["rent", "sale"] as Deal[]).map((deal) => (
          <section key={deal} className="mt-14" aria-labelledby={`types-${deal}`}>
            <div className="flex items-end justify-between gap-4">
              <h2 id={`types-${deal}`} className="section-title">{dealHeading(deal)}</h2>
              <Link href={listingPath(locale, { deal })} className="text-sm font-bold text-brand-600 hover:text-brand-700">{t.view_all}</Link>
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {typesForDeal(deal)
                .filter((type) => (typeCounts[deal].get(type.key) ?? 0) > 0)
                .slice(0, 12)
                .map((type) => (
                  <li key={type.key}>
                    <Link
                      href={listingPath(locale, { deal, type })}
                      className="card flex h-full flex-col items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-lift"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                        <Icon name={type.icon} size={22} />
                      </span>
                      <span>
                        <span className="block text-[15px] font-extrabold text-ink">{type.label[locale]}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-muted">{t.ads_count(typeCounts[deal].get(type.key) ?? 0)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}

        {[{ deal: "rent" as Deal, title: t.latest_rent, landing: latestRent }, { deal: "sale" as Deal, title: t.latest_sale, landing: latestSale }].map(
          ({ deal, title, landing }) =>
            landing.ads.length > 0 && (
              <section key={deal} className="mt-14" aria-labelledby={`latest-${deal}`}>
                <div className="flex items-end justify-between gap-4">
                  <h2 id={`latest-${deal}`} className="section-title">{title}</h2>
                  <Link href={listingPath(locale, { deal })} className="text-sm font-bold text-brand-600 hover:text-brand-700">{t.view_all}</Link>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 min-[1700px]:grid-cols-6">
                  {landing.ads.map((ad) => <AdCardView key={ad.id} ad={ad} locale={locale} />)}
                </div>
              </section>
            ),
        )}

        <section className="mt-14" aria-labelledby="cities-title">
          <h2 id="cities-title" className="section-title">{t.browse_by_city}</h2>
          <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {cities.map(({ city, count }) => (
              <li key={city.id}>
                <Link href={listingPath(locale, { deal: "rent", city })} className="card flex items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-ink transition hover:border-brand-500 hover:text-brand-700">
                  <span className="truncate">{placeName(city, locale)}</span>
                  <span className="shrink-0 text-xs font-semibold text-muted">{formatNumber(count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Price guides of the cities with the most ads, for renting and for buying an apartment */}
        <section className="mt-14" aria-labelledby="prices-title">
          <h2 id="prices-title" className="section-title">{locale === "en" ? "Property prices by area" : "أسعار العقارات حسب المنطقة"}</h2>
          <ul className="mt-5 grid gap-x-6 sm:grid-cols-2">
            {cities
              .filter(({ city, count }) => count >= 60 && (locale === "ar" || hasEnglishName(city)))
              .slice(0, 4)
              .flatMap(({ city }) =>
                (["rent", "sale"] as Deal[]).map((deal) => ({ key: `${city.id}-${deal}`, params: { deal, type: apartments, city } })),
              )
              .map(({ key, params }) => (
                <li key={key}>
                  <Link href={pricesPath(locale, params)} className="block border-b border-line py-2.5 text-sm text-body transition hover:text-brand-600">
                    {pricesHeading(locale, params)}
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        {amman && ammanAreas.length > 0 && (
          <section className="mt-14" aria-labelledby="areas-title">
            <h2 id="areas-title" className="section-title">{t.popular_areas}</h2>
            <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 min-[1700px]:grid-cols-6">
              {ammanAreas.map(({ region, count }) => (
                <li key={region!.id}>
                  <Link
                    href={listingPath(locale, { deal: "rent", type: apartments, city: amman, region: region! })}
                    className="card flex items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-ink transition hover:border-brand-500 hover:text-brand-700"
                  >
                    <span className="truncate">
                      {locale === "en" ? `Apartments for rent in ${placeName(region!, "en")}` : `شقق للإيجار في ${region!.name_ar}`}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-muted">{formatNumber(count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-14" aria-labelledby="why-title">
          <h2 id="why-title" className="section-title">{t.why_title}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {t.why.map(([title, body], i) => (
              <div key={title} className="card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name={WHY_ICONS[i]} size={22} />
                </span>
                <h3 className="mt-4 text-base font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <AppBand locale={locale} />
      </div>
      <JsonLd data={organizationJsonLd(locale)} />
      <JsonLd data={websiteJsonLd(locale)} />
    </>
  );
}
