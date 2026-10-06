import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./config";
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
    const letting = params.period ? `for ${RENT_PERIODS[params.period].label.en} Rent` : deal;
    return `${lead ? `${lead} ` : ""}${type} ${letting} in ${region ? `${region}, ` : ""}${city}`;
  }
  // "استوديو مفروش" but "شقق مفروشة"
  const furnished = params.type?.masculine ? "مفروش" : t.furnished;
  const extras = [params.bedrooms ? `${params.bedrooms} ${t.bedrooms}` : "", params.furnished ? furnished : ""]
    .filter(Boolean)
    .join(" ");
  // "شقق للإيجار اليومي في عمان"
  const letting = params.period ? `${deal} ${RENT_PERIODS[params.period].label.ar}` : deal;
  return `${type}${extras ? ` ${extras}` : ""} ${letting} في ${region ? `${region}، ` : ""}${city}`;
}

/**
 * The page title shown in search results: the phrase people search for, then the
 * number of ads, which is what makes a result worth clicking.
 */
export function listingTitle(locale: Locale, heading: string, total: number): string {
  if (total < 5) return heading;
  return locale === "en" ? `${heading} - ${formatNumber(total)} Listings with Prices` : `${heading} - ${formatNumber(total)} إعلان بالصور والأسعار`;
}

export function listingDescription(locale: Locale, params: ListingParams, landing: Landing): string {
  const heading = listingHeading(locale, params);
  const stats = landing.stats;
  const hasStats = !!stats && stats.count >= 5 && stats.median != null;
  if (locale === "en") {
    const price = hasStats
      ? ` Median price ${formatPrice(stats!.median, "en")}${params.deal === "rent" ? " per month" : ""}, typical range ${formatNumber(stats!.low!)}–${formatNumber(stats!.high!)}.`
      : "";
    return `${formatNumber(landing.total)} ${heading.toLowerCase()} with photos and prices.${price} Updated daily on Sooqcom.`;
  }
  const price = hasStats
    ? ` السعر الوسيط ${formatPrice(stats!.median, "ar")}${params.deal === "rent" ? " شهرياً" : ""} والنطاق الشائع ${formatNumber(stats!.low!)}–${formatNumber(stats!.high!)}.`
    : "";
  return `${formatNumber(landing.total)} إعلان ${heading} بالصور والأسعار.${price} إعلانات محدّثة يومياً على سوقكم.`;
}

export function alternatesFor(arPath: string, enPath: string | null, locale: Locale, query = ""): Metadata["alternates"] {
  const languages: Record<string, string> = { ar: absolute(arPath) + query, "x-default": absolute(arPath) + query };
  if (enPath) languages.en = absolute(enPath) + query;
  return { canonical: absolute(locale === "en" && enPath ? enPath : arPath) + query, languages };
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
    openGraph: { siteName: SITE_NAME[locale], locale: locale === "en" ? "en_US" : "ar_JO", type: "website" },
    twitter: { card: "summary_large_image" },
    icons: { icon: "/logo.png", apple: "/logo.png" },
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

export function listingJsonLd(locale: Locale, heading: string, landing: Landing) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    numberOfItems: landing.total,
    itemListElement: landing.ads.map((ad, index) => ({
      "@type": "ListItem",
      position: (landing.page - 1) * landing.page_size + index + 1,
      url: absolute(adPath(locale, ad)),
      name: ad.title,
    })),
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
    datePosted: ad.created_at ?? undefined,
    mainEntity: {
      "@type": ad.category_name.includes("أرا") ? "Landform" : "Accommodation",
      name: ad.title,
      numberOfBedrooms: ad.bedrooms ?? undefined,
      numberOfBathroomsTotal: ad.bathrooms ?? undefined,
      floorSize: ad.area ? { "@type": "QuantitativeValue", value: ad.area, unitCode: "MTK" } : undefined,
      address: {
        "@type": "PostalAddress",
        addressCountry: "JO",
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

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "سوقكم",
    alternateName: "Sooqcom",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    email: "support@sooq-com.com",
    areaServed: "JO",
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME[locale],
    url: absolute(homePath(locale)),
    inLanguage: locale,
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
