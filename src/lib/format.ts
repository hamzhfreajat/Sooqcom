import { dict } from "./i18n";
import type { AdCard, Deal, Locale } from "./types";

/** Above this, a rental price is almost always a yearly figure (same rule as the API). */
const YEARLY_RENT_THRESHOLD = 1500;

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function formatPrice(value: number | null | undefined, locale: Locale): string {
  if (value == null) return "";
  const t = dict(locale);
  return locale === "en" ? `${t.currency} ${formatNumber(value)}` : `${formatNumber(value)} ${t.currency}`;
}

/** "شهرياً" / "سنوياً" for rentals, empty for sales. */
export function pricePeriod(price: number | null, deal: Deal | null, locale: Locale): string {
  if (deal !== "rent" || price == null) return "";
  const t = dict(locale);
  return price >= YEARLY_RENT_THRESHOLD ? t.per_year : t.per_month;
}

/** A rental price expressed per month, so it can be compared with market figures. */
export function monthlyPrice(price: number, deal: Deal | null): number {
  return deal === "rent" && price >= YEARLY_RENT_THRESHOLD ? price / 12 : price;
}

export function timeAgo(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const then = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (Number.isNaN(days)) return "";
  if (locale === "en") {
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} mo ago`;
    return `${Math.floor(days / 365)} yr ago`;
  }
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days === 2) return "قبل يومين";
  if (days < 11) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${days} يوماً`;
  if (days < 365) return `قبل ${Math.floor(days / 30)} شهر`;
  return `قبل ${Math.floor(days / 365)} سنة`;
}

export function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "ar-JO-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function adLocation(ad: Pick<AdCard, "city_ar" | "city_en" | "region_ar" | "region_en">, locale: Locale): string {
  const latin = (v: string | null) => !!v && /[A-Za-z]/.test(v) && !/[؀-ۿ]/.test(v);
  const title = (v: string) => v.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const region = locale === "en" && latin(ad.region_en) ? title(ad.region_en as string) : ad.region_ar;
  const city = locale === "en" && latin(ad.city_en) ? title(ad.city_en as string) : ad.city_ar;
  return [region, city].filter(Boolean).join(locale === "en" ? ", " : "، ");
}

/** Card-size rendition of an optimized image; other URLs are returned unchanged. */
export function cardImage(url: string): string {
  return url.includes("/img/") && url.endsWith(".jpg") && !url.endsWith("_m.jpg") ? `${url.slice(0, -4)}_m.jpg` : url;
}

/** Plain one-line text for meta descriptions: no emoji, symbols or line breaks. */
export function plainText(value: string, maxLength: number): string {
  const cleaned = value
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{23FF}\u{2460}-\u{27BF}\u{2900}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200B}-\u{200F}]/gu, " ")
    .replace(/[|•●▪■□◆◇★☆*_=~#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength).trimEnd()}…` : cleaned;
}

/** tel: and WhatsApp links for a Jordanian number, or null when it is not usable. */
export function phoneLinks(phone: string | null | undefined): { tel: string; whatsapp: string } | null {
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 9) return null;
  const international = digits.startsWith("0") ? `962${digits.slice(1)}` : digits.replace(/^\+/, "");
  return { tel: `tel:${digits}`, whatsapp: `https://wa.me/${international}` };
}
