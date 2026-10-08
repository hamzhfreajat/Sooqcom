import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBand from "@/components/AppBand";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import { ApiNotFound, getLanding, getPrices, getTaxonomy } from "@/lib/api";
import { formatNumber, formatPrice } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { listingHeading, pageMetadata, pricesHeading } from "@/lib/seo";
import {
  DEALS,
  PRICE_GUIDE_TYPES,
  type PricesParams,
  categoryIdFor,
  hasEnglishName,
  homePath,
  listingPath,
  placeName,
  pricesPath,
  supportsPriceGuide,
  supportsBedrooms,
  taxonomyIndex,
} from "@/lib/taxonomy";
import type { Deal, Locale, PriceGuide } from "@/lib/types";

/** A guide needs this many areas (or cities) with a price before search engines may index it. */
const MIN_PLACES_TO_INDEX = 2;
/** Another guide is only linked when its kind of property has this many ads in the place. */
const MIN_ADS_FOR_GUIDE = 150;

function load(params: PricesParams): Promise<PriceGuide> {
  return getPrices(categoryIdFor({ deal: params.deal, type: params.type }), params.city?.id).catch((error) => {
    // No such guide (or a backend that does not offer guides yet) is a missing page, not a broken one
    if (error instanceof ApiNotFound) notFound();
    throw error;
  });
}

/** "450 د.أ شهرياً" for rents, "65,000 د.أ" for sales. */
function money(value: number, params: PricesParams, locale: Locale): string {
  const suffix = params.deal === "rent" ? ` ${dict(locale).per_month}` : "";
  return `${formatPrice(value, locale)}${suffix}`;
}

/** One or two sentences that state what the numbers say, all taken from the data. */
function summary(locale: Locale, params: PricesParams, guide: PriceGuide): string {
  const stats = guide.stats;
  if (!stats.count || stats.median == null) return "";
  const byPrice = [...guide.places].sort((a, b) => a.median - b.median);
  const cheapest = byPrice[0];
  const dearest = byPrice[byPrice.length - 1];
  const spread = guide.places.length >= 2 && cheapest.id !== dearest.id;
  if (locale === "en") {
    const lead = `The median is ${money(stats.median, params, "en")}, and most listings fall between ${formatNumber(stats.low ?? 0)} and ${formatNumber(stats.high ?? 0)}, based on ${formatNumber(stats.count)} listings on Sooqcom.`;
    return spread
      ? `${lead} The lowest median is in ${placeName(cheapest, "en")} (${formatPrice(cheapest.median, "en")}) and the highest in ${placeName(dearest, "en")} (${formatPrice(dearest.median, "en")}).`
      : lead;
  }
  const lead = `السعر الوسيط ${money(stats.median, params, "ar")}، ومعظم الإعلانات بين ${formatNumber(stats.low ?? 0)} و${formatNumber(stats.high ?? 0)}، بناءً على ${formatNumber(stats.count)} إعلان على سوقكم.`;
  return spread
    ? `${lead} أقل سعر وسيط في ${cheapest.name_ar} (${formatPrice(cheapest.median, "ar")}) وأعلى سعر وسيط في ${dearest.name_ar} (${formatPrice(dearest.median, "ar")}).`
    : lead;
}

export async function pricesMetadata(locale: Locale, params: PricesParams): Promise<Metadata> {
  const guide = await load(params);
  const heading = pricesHeading(locale, params);
  const english = hasEnglishName(params.city);
  return pageMetadata({
    locale,
    title: heading,
    description: summary(locale, params, guide) || heading,
    arPath: pricesPath("ar", params),
    enPath: english ? pricesPath("en", params) : null,
    index: guide.places.length >= MIN_PLACES_TO_INDEX && (locale === "ar" || english),
  });
}

export default async function PricesView({ locale, params }: { locale: Locale; params: PricesParams }) {
  const t = dict(locale);
  const en = locale === "en";
  const otherDeal: Deal = params.deal === "rent" ? "sale" : "rent";
  const [guide, taxonomy, sameDeal, oppositeDeal] = await Promise.all([
    load(params),
    getTaxonomy(),
    // How many ads each kind of property has here, so only guides that exist are linked
    getLanding({ categoryId: DEALS[params.deal].id, cityId: params.city?.id, pageSize: 1 }),
    getLanding({ categoryId: DEALS[otherDeal].id, cityId: params.city?.id, pageSize: 1 }),
  ]);
  if (!guide.stats.count) notFound();
  const adsOf = (deal: Deal, id: number | undefined) =>
    ((deal === params.deal ? sameDeal : oppositeDeal).category_counts ?? []).find((entry) => entry.id === id)?.count ?? 0;
  const index = taxonomyIndex(taxonomy);
  const heading = pricesHeading(locale, params);
  const listing = { deal: params.deal, type: params.type, city: params.city };

  const crumbs: Crumb[] = [
    { name: t.home, path: homePath(locale) },
    { name: listingHeading(locale, { deal: params.deal, type: params.type }), path: listingPath(locale, { deal: params.deal, type: params.type }) },
  ];
  if (params.city) crumbs.push({ name: placeName(params.city, locale), path: listingPath(locale, listing) });
  crumbs.push({ name: en ? "Prices" : "الأسعار", path: pricesPath(locale, params) });

  // Each row leads to the ads it was computed from: an area's listing page, or a city's own guide
  const rows = guide.places
    .map((place) => {
      const region = params.city ? index.regionsById.get(place.id) : undefined;
      const city = params.city ?? index.citiesById.get(place.id);
      if (!city || (params.city && !region)) return null;
      if (en && !hasEnglishName(region ?? city)) return null;
      return {
        ...place,
        name: placeName(region ?? city, locale),
        href: region ? listingPath(locale, { ...listing, city, region }) : pricesPath(locale, { ...params, city }),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const others = PRICE_GUIDE_TYPES.filter((type) => type.key !== params.type.key && supportsPriceGuide(params.deal, type) && adsOf(params.deal, type.ids[params.deal]) >= MIN_ADS_FOR_GUIDE).map((type) => ({
    name: pricesHeading(locale, { ...params, type }),
    href: pricesPath(locale, { ...params, type }),
  }));
  if (supportsPriceGuide(otherDeal, params.type) && adsOf(otherDeal, params.type.ids[otherDeal]) >= MIN_ADS_FOR_GUIDE) {
    others.unshift({ name: pricesHeading(locale, { ...params, deal: otherDeal }), href: pricesPath(locale, { ...params, deal: otherDeal }) });
  }

  const stats = guide.stats;
  const faqs: { question: string; answer: string }[] = [];
  if (stats.median != null) {
    faqs.push(
      en
        ? { question: `What is the typical price in ${heading.replace(/ by (Area|City)$/, "")}?`, answer: summary("en", params, guide) }
        : { question: `كم ${heading.replace(/ حسب (المنطقة|المدينة)$/, "").replace(/^أسعار/, "سعر")}؟`, answer: summary("ar", params, guide) },
    );
  }
  faqs.push(
    en
      ? { question: "Where do these prices come from?", answer: `They are computed from the asking prices of the ${formatNumber(stats.count)} listings currently on Sooqcom for this kind of property. They are asking prices, not registered contract prices, and they change as listings are added and removed.` }
      : { question: "من أين تأتي هذه الأسعار؟", answer: `محسوبة من الأسعار المطلوبة في ${formatNumber(stats.count)} إعلان معروض حالياً على سوقكم لهذا النوع من العقار. هي أسعار مطلوبة في الإعلانات وليست أسعار عقود موثّقة، وتتغير مع إضافة الإعلانات وإزالتها.` },
  );
  faqs.push(
    en
      ? { question: "What does the median price mean?", answer: "Half of the listings ask for less than the median and half ask for more. It is less affected by a few very expensive or very cheap listings than an average is." }
      : { question: "ما معنى السعر الوسيط؟", answer: "نصف الإعلانات تطلب أقل من السعر الوسيط ونصفها يطلب أكثر. وهو أقل تأثراً من المتوسط الحسابي بالإعلانات القليلة المرتفعة جداً أو المنخفضة جداً." },
  );

  const updated = guide.updated_at ? new Date(guide.updated_at).toLocaleDateString(en ? "en-GB" : "ar-JO", { year: "numeric", month: "long", day: "numeric" }) : null;
  const cell = "px-4 py-3 text-sm";

  return (
    <div className="bg-surface">
      <div className="container-page pb-16 pt-6">
        <header className="rounded-2xl border border-line bg-white px-5 py-5 shadow-card sm:px-6">
          <Breadcrumbs items={crumbs} label={t.home} />
          <h1 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">{heading}</h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-8 text-body">{summary(locale, params, guide)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={listingPath(locale, listing)} className="btn-primary">
              {listingHeading(locale, listing)} ({formatNumber(stats.count)})
            </Link>
            {updated && <span className="text-xs text-muted">{en ? `Updated ${updated}` : `آخر تحديث: ${updated}`}</span>}
          </div>
        </header>

        {rows.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card" aria-labelledby="by-place">
            <h2 id="by-place" className="px-5 pt-5 text-lg font-bold sm:px-6">
              {params.city ? (en ? `Prices by area in ${placeName(params.city, "en")}` : `الأسعار حسب المنطقة في ${params.city.name_ar}`) : en ? "Prices by city" : "الأسعار حسب المدينة"}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-start">
                <thead>
                  <tr className="border-y border-line bg-surface text-xs font-bold text-muted">
                    <th scope="col" className={`${cell} text-start`}>{params.city ? (en ? "Area" : "المنطقة") : en ? "City" : "المدينة"}</th>
                    <th scope="col" className={`${cell} text-start`}>{en ? "Median price" : "السعر الوسيط"}</th>
                    <th scope="col" className={`${cell} text-start`}>{en ? "Typical range" : "النطاق الشائع"}</th>
                    <th scope="col" className={`${cell} text-start`}>{en ? "Listings" : "عدد الإعلانات"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <th scope="row" className={`${cell} text-start font-bold`}>
                        <Link href={row.href} className="text-brand-700 hover:underline">{row.name}</Link>
                      </th>
                      <td className={`${cell} font-bold text-ink`}>{money(row.median, params, locale)}</td>
                      <td className={`${cell} text-body`} dir="ltr">{formatNumber(row.low)} – {formatNumber(row.high)}</td>
                      <td className={`${cell} text-muted`}>{formatNumber(row.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {supportsBedrooms(params.type) && guide.bedrooms.length > 1 && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card" aria-labelledby="by-bedrooms">
            <h2 id="by-bedrooms" className="px-5 pt-5 text-lg font-bold sm:px-6">{en ? "Prices by number of bedrooms" : "الأسعار حسب عدد غرف النوم"}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-start">
                <thead>
                  <tr className="border-y border-line bg-surface text-xs font-bold text-muted">
                    <th scope="col" className={`${cell} text-start`}>{en ? "Bedrooms" : "غرف النوم"}</th>
                    <th scope="col" className={`${cell} text-start`}>{en ? "Median price" : "السعر الوسيط"}</th>
                    <th scope="col" className={`${cell} text-start`}>{en ? "Typical range" : "النطاق الشائع"}</th>
                    <th scope="col" className={`${cell} text-start`}>{en ? "Listings" : "عدد الإعلانات"}</th>
                  </tr>
                </thead>
                <tbody>
                  {guide.bedrooms.map((row) => (
                    <tr key={row.value} className="border-b border-line last:border-0">
                      <th scope="row" className={`${cell} text-start font-bold`}>
                        <Link href={listingPath(locale, { ...listing, bedrooms: row.value })} className="text-brand-700 hover:underline">
                          {row.value} {t.bedrooms}
                        </Link>
                      </th>
                      <td className={`${cell} font-bold text-ink`}>{money(row.median, params, locale)}</td>
                      <td className={`${cell} text-body`} dir="ltr">{formatNumber(row.low)} – {formatNumber(row.high)}</td>
                      <td className={`${cell} text-muted`}>{formatNumber(row.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {others.length > 0 && (
          <nav className="mt-10" aria-labelledby="other-guides">
            <h2 id="other-guides" className="section-title">{en ? "More price guides" : "أدلة أسعار أخرى"}</h2>
            <ul className="mt-5 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="block border-b border-line py-2.5 text-sm text-body transition hover:text-brand-600">{link.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <Faq title={t.faq_title} faqs={faqs} />
        <AppBand locale={locale} />
      </div>
    </div>
  );
}
