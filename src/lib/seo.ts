import type { Metadata } from "next";
import {
  APP_STORE_URL,
  BING_SITE_VERIFICATION,
  COUNTRY,
  DEFAULT_OG_IMAGE,
  GOOGLE_SITE_VERIFICATION,
  HREFLANG,
  OG_LOCALE,
  PLAY_STORE_URL,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
} from "./config";
import { formatNumber, formatPrice, plainText } from "./format";
import { dict } from "./i18n";
import {
  DEALS,
  RENT_PERIODS,
  type ListingParams,
  adPath,
  englishIndexable,
  homePath,
  listingPath,
  placeName,
} from "./taxonomy";
import type { AdDetail, Landing, Locale } from "./types";

export const absolute = (path: string) => `${SITE_URL}${encodeURI(path)}`;

/** "شقق 3 غرف نوم للإيجار في خلدا، عمان" / "3-Bedroom Apartments for Rent in Khalda, Amman" */
export function listingHeading(locale: Locale, params: ListingParams): string {
  const t = dict(locale);
  const type = params.type?.label[locale] ?? t.properties;
  const deal = DEALS[params.deal].label[locale];
  const city = params.city ? placeName(params.city, locale) : t.jordan;
  const region = params.region ? placeName(params.region, locale) : null;
  if (locale === "en") {
    const lead = [params.bedrooms ? `${params.bedrooms}-Bedroom` : "", params.furnished ? "Furnished" : ""]
      .filter(Boolean)
      .join(" ");
    const front = [lead, params.feature === "unfurnished" ? "Unfurnished" : "", params.feature === "ground" ? "Ground-Floor" : ""].filter(Boolean).join(" ");
    const letting = params.period ? `for ${RENT_PERIODS[params.period].label.en} Rent` : deal;
    const tail = [
      params.feature === "owner" ? " by Owner" : "",
      params.feature === "instalments" ? " with Instalments" : "",
      params.cap ? ` under JOD ${formatNumber(params.cap)}` : "",
    ].join("");
    return `${front ? `${front} ` : ""}${type} ${letting}${tail} in ${region ? `${region}, ` : ""}${city}`;
  }
  // "استوديو مفروش" but "شقق مفروشة"
  const furnished = params.type?.masculine ? "مفروش" : t.furnished;
  const extras = [
    params.bedrooms ? `${params.bedrooms} ${t.bedrooms}` : "",
    params.furnished ? furnished : "",
    // "استوديو فارغ" but "شقق فارغة"
    params.feature === "unfurnished" ? (params.type?.masculine ? "فارغ" : "فارغة") : "",
    params.feature === "ground" ? "طابق أرضي" : "",
  ]
    .filter(Boolean)
    .join(" ");
  // "شقق للإيجار اليومي في عمان"
  const letting = params.period ? `${deal} ${RENT_PERIODS[params.period].label.ar}` : deal;
  // "شقق للإيجار من المالك", "شقق للبيع بالتقسيط", "شقق للإيجار بأقل من 200 دينار"
  const tail = [
    params.feature === "owner" ? " من المالك" : "",
    params.feature === "instalments" ? " بالتقسيط" : "",
    params.cap ? ` بأقل من ${params.cap >= 1000 ? `${formatNumber(params.cap / 1000)} ألف` : formatNumber(params.cap)} دينار` : "",
  ].join("");
  return `${type}${extras ? ` ${extras}` : ""} ${letting}${tail} في ${region ? `${region}، ` : ""}${city}`;
}

/**
 * The page title shown in search results: the phrase people search for, then the
 * number of ads, which is what makes a result worth clicking.
 */
export function listingTitle(locale: Locale, heading: string, total: number): string {
  if (total < 5) return heading;
  return locale === "en" ? `${heading} - ${formatNumber(total)} Listings with Prices` : `${heading} - ${formatNumber(total)} إعلان بالصور والأسعار`;
}

export function listingDescription(locale: Locale, params: ListingParams, landing: Landing, page = 1): string {
  const heading = listingHeading(locale, params);
  // Later pages say which page they are, so no two pages share a description
  const suffix = page > 1 ? ` ${dict(locale).page_of(page, Math.max(1, Math.ceil(landing.total / landing.page_size)))}.` : "";
  const stats = landing.stats;
  const hasStats = !!stats && stats.count >= 5 && stats.median != null;
  if (locale === "en") {
    const price = hasStats
      ? ` Median price ${formatPrice(stats!.median, "en")}${params.deal === "rent" ? " per month" : ""}, typical range ${formatNumber(stats!.low!)}–${formatNumber(stats!.high!)}.`
      : "";
    return `${formatNumber(landing.total)} listings: ${heading}, with photos and prices.${price} Updated daily on Sooqcom.${suffix}`;
  }
  const price = hasStats
    ? ` السعر الوسيط ${formatPrice(stats!.median, "ar")}${params.deal === "rent" ? " شهرياً" : ""} والنطاق الشائع ${formatNumber(stats!.low!)}–${formatNumber(stats!.high!)}.`
    : "";
  return `${formatNumber(landing.total)} إعلان ${heading} بالصور والأسعار.${price} إعلانات محدّثة يومياً على سوقكم.${suffix}`;
}

/** The home page is "https://site/" in every tag, so the canonical, the sitemap and the links agree. */
const pageUrl = (path: string, query = "") => (path === "/" ? `${SITE_URL}/` : absolute(path)) + query;

export function alternatesFor(arPath: string, enPath: string | null, locale: Locale, query = ""): NonNullable<Metadata["alternates"]> {
  // Arabic is the default for anyone the two language tags do not cover
  const languages: Record<string, string> = { [HREFLANG.ar]: pageUrl(arPath, query), "x-default": pageUrl(arPath, query) };
  if (enPath) languages[HREFLANG.en] = pageUrl(enPath, query);
  return { canonical: pageUrl(locale === "en" && enPath ? enPath : arPath, query), languages };
}

export interface PageSeo {
  locale: Locale;
  title: string;
  description: string;
  /** Address of the Arabic page, and of the English one when it exists */
  arPath: string;
  enPath?: string | null;
  /** Part of the address after "?", for paginated pages */
  query?: string;
  /** The title is complete as given: the site name is not appended */
  absoluteTitle?: boolean;
  /** Photo for sharing; the logo is used without one */
  image?: string | null;
  type?: "website" | "article";
  /** false keeps the page out of search engines (its links are still followed) */
  index?: boolean;
  /** Set when the page to index is another one (an English ad page points at the Arabic one) */
  canonical?: string;
}

/**
 * Everything a page tells search engines and social networks, built the same way for
 * every page: title, description, canonical, language alternates, robots, Open Graph
 * and Twitter. Pages only state what is particular to them.
 */
export function pageMetadata(seo: PageSeo): Metadata {
  const alternates = seo.canonical
    ? { canonical: seo.canonical }
    : alternatesFor(seo.arPath, seo.enPath ?? null, seo.locale, seo.query);
  const url = alternates.canonical as string;
  const shareTitle = seo.absoluteTitle ? seo.title : `${seo.title} | ${SITE_NAME[seo.locale]}`;
  const images = seo.image ? [{ url: seo.image }] : [DEFAULT_OG_IMAGE];
  const other: Locale = seo.locale === "ar" ? "en" : "ar";
  return {
    title: seo.absoluteTitle ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates,
    robots: seo.index === false ? { index: false, follow: true } : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      title: shareTitle,
      description: seo.description,
      url,
      siteName: SITE_NAME[seo.locale],
      locale: OG_LOCALE[seo.locale],
      alternateLocale: seo.enPath && !seo.canonical ? [OG_LOCALE[other]] : undefined,
      type: seo.type ?? "website",
      images,
    },
    twitter: {
      card: seo.image ? "summary_large_image" : "summary",
      title: shareTitle,
      description: seo.description,
      images: images.map((image) => image.url),
    },
  };
}

export function listingAlternates(locale: Locale, params: ListingParams, page: number) {
  const query = page > 1 ? `?page=${page}` : "";
  return alternatesFor(
    listingPath("ar", params),
    englishIndexable(params) ? listingPath("en", params) : null,
    locale,
    query,
  );
}

export function baseMetadata(locale: Locale): Metadata {
  const t = dict(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${SITE_NAME[locale]} | ${t.tagline}`, template: `%s | ${SITE_NAME[locale]}` },
    description: t.footer_about,
    applicationName: SITE_NAME[locale],
    openGraph: { siteName: SITE_NAME[locale], locale: OG_LOCALE[locale], type: "website", images: [DEFAULT_OG_IMAGE] },
    twitter: { card: "summary", images: [DEFAULT_OG_IMAGE.url] },
    // A flat mark on a solid colour: it stays readable at the size of a search result's icon,
    // and fills the circle search engines crop it to
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
        { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: "/apple-touch-icon.png",
    },
    // Phone numbers in ad text are not turned into links that shift the layout on iPhones
    formatDetection: { telephone: false },
    verification: {
      google: GOOGLE_SITE_VERIFICATION || undefined,
      other: BING_SITE_VERIFICATION ? { "msvalidate.01": BING_SITE_VERIFICATION } : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const websiteId = (locale: Locale) => `${absolute(homePath(locale))}#website`;

/** The place a page is about, down to the area when it has one. Always inside Jordan. */
function placeJsonLd(locale: Locale, params: ListingParams) {
  const city = params.city ? placeName(params.city, locale) : null;
  const region = params.region ? placeName(params.region, locale) : null;
  return {
    "@type": "Place",
    name: [region, city].filter(Boolean).join(locale === "en" ? ", " : "، ") || COUNTRY.name[locale],
    address: {
      "@type": "PostalAddress",
      addressCountry: COUNTRY.code,
      addressRegion: city ?? undefined,
      addressLocality: region ?? city ?? undefined,
    },
  };
}

/** A listing page: a collection of ads about one kind of property in one place. */
export function listingJsonLd(locale: Locale, heading: string, landing: Landing, params: ListingParams, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    url,
    name: heading,
    inLanguage: HREFLANG[locale],
    isPartOf: { "@id": websiteId(locale) },
    about: placeJsonLd(locale, params),
    mainEntity: {
      "@type": "ItemList",
      name: heading,
      numberOfItems: landing.total,
      itemListElement: landing.ads.map((ad, index) => ({
        "@type": "ListItem",
        position: (landing.page - 1) * landing.page_size + index + 1,
        // Ad text is Arabic, so the Arabic ad page is the one search engines index
        url: absolute(adPath("ar", ad)),
        name: ad.title,
      })),
    },
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function adJsonLd(locale: Locale, ad: AdDetail) {
  const url = absolute(adPath(locale, ad));
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: ad.title,
    url,
    description: plainText(ad.description, 500),
    image: ad.images.slice(0, 6),
    inLanguage: HREFLANG.ar,
    isPartOf: { "@id": websiteId(locale) },
    datePosted: ad.created_at ?? undefined,
    dateModified: ad.updated_at ?? ad.created_at ?? undefined,
    mainEntity: {
      "@type": ad.category_name.includes("أرا") ? "Landform" : "Accommodation",
      name: ad.title,
      numberOfBedrooms: ad.bedrooms ?? undefined,
      numberOfBathroomsTotal: ad.bathrooms ?? undefined,
      floorSize: ad.area ? { "@type": "QuantitativeValue", value: ad.area, unitCode: "MTK" } : undefined,
      address: {
        "@type": "PostalAddress",
        addressCountry: COUNTRY.code,
        addressRegion: ad.city_ar ?? undefined,
        addressLocality: ad.region_ar ?? ad.city_ar ?? undefined,
      },
    },
    offers: ad.price
      ? {
          "@type": "Offer",
          price: ad.price,
          priceCurrency: "JOD",
          availability: ad.live ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          businessFunction:
            ad.deal === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
          url,
        }
      : undefined,
  };
  if (ad.reviews_count > 0 && ad.rating_avg != null) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ad.rating_avg,
      reviewCount: ad.reviews_count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return data;
}

/** Who runs the site. Only facts that are on the site itself: no address or phone is made up. */
export function organizationJsonLd(locale: Locale = "ar") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME.ar,
    alternateName: SITE_NAME.en,
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: `${SITE_URL}${DEFAULT_OG_IMAGE.url}`, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    description: dict(locale).footer_about,
    email: SUPPORT_EMAIL,
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: SUPPORT_EMAIL, availableLanguage: ["ar", "en"], areaServed: COUNTRY.code },
    areaServed: { "@type": "Country", name: COUNTRY.name[locale] },
    // The same organisation's mobile apps
    sameAs: [PLAY_STORE_URL, APP_STORE_URL],
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(locale),
    name: SITE_NAME[locale],
    alternateName: SITE_NAME[locale === "ar" ? "en" : "ar"],
    url: locale === "en" ? absolute(homePath(locale)) : `${SITE_URL}/`,
    inLanguage: HREFLANG[locale],
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** The "about us" page, tied to the organisation it describes. */
export function aboutJsonLd(locale: Locale, title: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: absolute(path),
    name: title,
    inLanguage: HREFLANG[locale],
    isPartOf: { "@id": websiteId(locale) },
    about: { "@id": ORGANIZATION_ID },
  };
}

/** Questions answered from the page's own numbers, so every answer is specific and true. */
export function listingFaqs(locale: Locale, params: ListingParams, landing: Landing) {
  const heading = listingHeading(locale, params);
  const stats = landing.stats;
  const faqs: { question: string; answer: string }[] = [];
  const perMonth = params.deal === "rent";

  if (locale === "en") {
    faqs.push({
      question: `How many ${heading.toLowerCase()} are available?`,
      answer: `There are currently ${formatNumber(landing.total)} listings on Sooqcom, each with photos and a price. New listings are added every day.`,
    });
    if (stats && stats.count >= 5 && stats.median != null) {
      faqs.push({
        question: `What is the typical price of ${heading.toLowerCase()}?`,
        answer: `The median price is ${formatPrice(stats.median, "en")}${perMonth ? " per month" : ""}. Most listings fall between ${formatPrice(stats.low, "en")} and ${formatPrice(stats.high, "en")}, based on ${formatNumber(stats.count)} listings.`,
      });
    }
    if (landing.locations.length >= 3) {
      const top = landing.locations.slice(0, 5).map((l) => `${placeName(l, "en")} (${formatNumber(l.count)})`);
      faqs.push({ question: `Which areas have the most listings?`, answer: `The areas with the most listings are ${top.join(", ")}.` });
    }
    return faqs;
  }

  faqs.push({
    question: `كم عدد إعلانات ${heading} المتاحة؟`,
    answer: `يوجد حالياً ${formatNumber(landing.total)} إعلان على سوقكم، جميعها بالصور والسعر، وتُضاف إعلانات جديدة يومياً.`,
  });
  if (stats && stats.count >= 5 && stats.median != null) {
    faqs.push({
      question: `كم سعر ${heading}؟`,
      answer: `السعر الوسيط ${formatPrice(stats.median, "ar")}${perMonth ? " شهرياً" : ""}، ومعظم الإعلانات بين ${formatPrice(stats.low, "ar")} و${formatPrice(stats.high, "ar")}، بناءً على ${formatNumber(stats.count)} إعلان.`,
    });
  }
  if (landing.locations.length >= 3) {
    const top = landing.locations.slice(0, 5).map((l) => `${l.name_ar} (${formatNumber(l.count)})`);
    faqs.push({ question: `ما هي المناطق الأكثر إعلانات؟`, answer: `أكثر المناطق إعلانات: ${top.join("، ")}.` });
  }
  return faqs;
}
