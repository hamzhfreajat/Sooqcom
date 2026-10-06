import type { Metadata } from "next";
import Link from "next/link";
import AdCardView from "@/components/AdCardView";
import AppBand from "@/components/AppBand";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import ContactBox from "@/components/ContactBox";
import ReviewsSection from "@/components/ReviewsSection";
import Gallery from "@/components/Gallery";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import { getTaxonomy } from "@/lib/api";
import { SHARE_URL } from "@/lib/config";
import { adLocation, cardImage, formatDate, formatPrice, monthlyPrice, plainText, pricePeriod } from "@/lib/format";
import { DETAIL_LABELS, dict } from "@/lib/i18n";
import { absolute, adJsonLd } from "@/lib/seo";
import { DEALS, adPath, homePath, listingPath, placeName, taxonomyIndex, typeOfCategory } from "@/lib/taxonomy";
import type { AdDetail, Locale } from "@/lib/types";

export function adMetadata(locale: Locale, ad: AdDetail): Metadata {
  const location = adLocation(ad, locale);
  const price = formatPrice(ad.price, locale);
  const title = [ad.seo_title ?? ad.title, price].filter(Boolean).join(" - ");
  const description = `${ad.title}${location ? ` | ${location}` : ""}${price ? ` | ${price}` : ""}. ${plainText(ad.description, 140)}`;
  return {
    title,
    description,
    // The ad's text is Arabic in both languages, so the Arabic page is the one to index
    alternates: { canonical: absolute(adPath("ar", ad)) },
    robots: ad.indexable && locale === "ar" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, type: "article", images: ad.images.slice(0, 1) },
  };
}

export default async function AdView({ locale, ad }: { locale: Locale; ad: AdDetail }) {
  const t = dict(locale);
  const taxonomy = await getTaxonomy();
  const index = taxonomyIndex(taxonomy);
  const deal = ad.deal ?? "sale";
  const type = typeOfCategory(ad.category_id, deal, taxonomy);
  const city = ad.city_id != null ? index.citiesById.get(ad.city_id) : undefined;
  const region = ad.region_id != null ? index.regionsById.get(ad.region_id) : undefined;
  const location = adLocation(ad, locale);
  const period = pricePeriod(ad.price, ad.deal, locale);

  const crumbs: Crumb[] = [
    { name: t.home, path: homePath(locale) },
    {
      name: locale === "en" ? `${t.properties} ${DEALS[deal].label.en}` : `${t.properties} ${DEALS[deal].label.ar}`,
      path: listingPath(locale, { deal }),
    },
  ];
  if (type) crumbs.push({ name: type.label[locale], path: listingPath(locale, { deal, type }) });
  if (city) crumbs.push({ name: placeName(city, locale), path: listingPath(locale, { deal, type, city }) });
  if (city && region) crumbs.push({ name: placeName(region, locale), path: listingPath(locale, { deal, type, city, region }) });
  const parentPath = crumbs[crumbs.length - 1].path;
  crumbs.push({ name: ad.title, path: adPath(locale, ad) });

  // Compare with the area's median when there are enough comparable ads
  let marketNote: { text: string; tone: "good" | "high" | "neutral" } | null = null;
  if (ad.price && ad.market.count >= 8 && ad.market.median) {
    const diff = Math.round(((monthlyPrice(ad.price, ad.deal) - ad.market.median) / ad.market.median) * 100);
    if (Math.abs(diff) <= 5) marketNote = { text: t.around_market, tone: "neutral" };
    else if (diff < 0 && diff >= -60) marketNote = { text: t.below_market(Math.abs(diff)), tone: "good" };
    else if (diff > 0 && diff <= 150) marketNote = { text: t.above_market(diff), tone: "high" };
  }

  const facts: { icon: string; label: string; value: string }[] = [];
  if (ad.bedrooms != null) facts.push({ icon: "bed", label: t.bedrooms, value: ad.bedrooms === 0 ? t.studio : String(ad.bedrooms) });
  if (ad.bathrooms != null) facts.push({ icon: "bath", label: t.bathrooms, value: String(ad.bathrooms) });
  if (ad.area) facts.push({ icon: "area", label: locale === "en" ? "Area" : "المساحة", value: `${Math.round(ad.area)} ${t.sqm}` });
  if (ad.furnished != null) facts.push({ icon: "home", label: locale === "en" ? "Furnishing" : "الفرش", value: ad.furnished ? t.furnished : t.unfurnished });

  const details = Object.entries(ad.details)
    .filter(([key]) => DETAIL_LABELS[key])
    .map(([key, value]) => ({ label: DETAIL_LABELS[key][locale], value: Array.isArray(value) ? value.join("، ") : String(value) }));

  if (!ad.live) {
    return (
      <div className="container-page py-6">
        <Breadcrumbs items={crumbs.slice(0, -1)} label={t.home} />
        <div className="card mt-6 px-6 py-12 text-center">
          <Icon name="alert" size={40} className="mx-auto text-muted" />
          <h1 className="mt-4 text-2xl font-black">{t.ad_unavailable_title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">{t.ad_unavailable_body}</p>
          <Link href={parentPath} className="btn-primary mt-6">{t.browse_similar}</Link>
        </div>
        <SimilarAds ad={ad} locale={locale} title={t.similar_ads} />
      </div>
    );
  }

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={crumbs} label={t.home} />

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <Gallery
            images={ad.images}
            thumbs={ad.images.map(cardImage)}
            alt={ad.title}
            labels={{
              enlarge: locale === "en" ? "Enlarge" : "تكبير الصور",
              close: t.close,
              previous: locale === "en" ? "Previous photo" : "الصورة السابقة",
              next: locale === "en" ? "Next photo" : "الصورة التالية",
            }}
          />

          <header className="mt-6">
            <h1 className="text-2xl font-black leading-snug sm:text-[28px]">{ad.title}</h1>
            {location && (
              <p className="mt-2 flex items-center gap-1.5 text-muted">
                <Icon name="pin" size={18} />
                {location}
              </p>
            )}
          </header>

          {facts.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="card flex items-center gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={fact.icon} size={20} />
                  </span>
                  <div className="min-w-0">
                    <dt className="truncate text-xs font-semibold text-muted">{fact.label}</dt>
                    <dd className="truncate text-[15px] font-extrabold text-ink">{fact.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}

          <section className="card mt-6 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">{t.description}</h2>
            <p className="mt-3 whitespace-pre-line break-words leading-8 text-body" dir="auto">{ad.description}</p>
          </section>

          {details.length > 0 && (
            <section className="card mt-6 p-5 sm:p-6">
              <h2 className="text-lg font-extrabold">{t.details}</h2>
              <dl className="mt-3 divide-y divide-line">
                {details.map((row) => (
                  <div key={row.label} className="flex justify-between gap-6 py-3 text-sm">
                    <dt className="shrink-0 font-semibold text-muted">{row.label}</dt>
                    <dd className="text-end font-bold text-ink">{row.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-6 py-3 text-sm">
                  <dt className="font-semibold text-muted">{t.ad_number}</dt>
                  <dd className="font-bold text-ink" dir="ltr">#{ad.id}</dd>
                </div>
                <div className="flex justify-between gap-6 py-3 text-sm">
                  <dt className="font-semibold text-muted">{t.posted}</dt>
                  <dd className="font-bold text-ink">{formatDate(ad.created_at, locale)}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-700">{formatPrice(ad.price, locale)}</span>
              {period && <span className="text-sm font-semibold text-muted">{period}</span>}
            </p>
            {marketNote && (
              <p
                className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
                  marketNote.tone === "good"
                    ? "bg-emerald-50 text-emerald-700"
                    : marketNote.tone === "high"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-surface text-body"
                }`}
              >
                <Icon name="chart" size={16} />
                {marketNote.text}
              </p>
            )}
            {ad.reviews_count > 0 && ad.rating_avg != null && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-ink">
                <Icon name="star" size={18} className="text-star" fill="currentColor" />
                {ad.rating_avg.toFixed(1)}
                <span className="font-semibold text-muted">({ad.reviews_count} {t.reviews})</span>
              </p>
            )}
            <hr className="my-5 border-line" />
            <ContactBox
              phone={ad.phone}
              appUrl={`${SHARE_URL}/ad/${ad.id}`}
              labels={{ title: t.contact_title, showNumber: t.show_number, whatsapp: t.whatsapp, openInApp: t.open_in_app }}
            />
            {ad.owner_name && (
              <p className="mt-4 text-sm text-muted">
                {t.advertiser}: <span className="font-bold text-ink">{ad.owner_name}</span>
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-amber-900">
              <Icon name="shield" size={18} />
              {t.safety_title}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
              {t.safety_tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <Icon name="check" size={16} className="mt-1 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Reviews sit under the details, in the same column */}
      <div className="lg:max-w-[calc(100%-392px)]">
        <ReviewsSection adId={ad.id} locale={locale} />
      </div>

      <SimilarAds ad={ad} locale={locale} title={t.similar_ads} />
      <AppBand locale={locale} />
      <JsonLd data={adJsonLd(locale, ad)} />
    </div>
  );
}

function SimilarAds({ ad, locale, title }: { ad: AdDetail; locale: Locale; title: string }) {
  if (ad.similar.length === 0) return null;
  return (
    <section className="mt-12" aria-labelledby="similar-title">
      <h2 id="similar-title" className="section-title">{title}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 min-[1700px]:grid-cols-6">
        {ad.similar.slice(0, 8).map((item) => (
          <AdCardView key={item.id} ad={item} locale={locale} />
        ))}
      </div>
    </section>
  );
}
