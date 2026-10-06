import Link from "next/link";
import { SHARE_URL } from "@/lib/config";
import { adLocation, formatPrice, monthlyPrice, pricePeriod, timeAgo } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { adPath } from "@/lib/taxonomy";
import type { AdCard, Locale } from "@/lib/types";
import CardContact from "./CardContact";
import CardGallery from "./CardGallery";
import Icon from "./Icon";

/** English for the commonest card tags; anything else is shown as the advertiser wrote it */
export const TAGS_EN: Record<string, string> = {
  "شهري": "Monthly", "سنوي": "Yearly", "يومي": "Daily", "أسبوعي": "Weekly", "مفروشة": "Furnished", "غير مفروشة": "Unfurnished",
  "مفروش جزئياً": "Partly furnished", "يوجد مصعد": "Lift", "موقف سيارات": "Parking", "كراج": "Garage", "حارس / أمن وحماية": "Guard",
  "شرفة / بلكونة": "Balcony", "تدفئة": "Heating", "تكييف مركزي": "Central A/C", "خزائن حائط": "Wardrobes", "غرفة غسيل": "Laundry room",
  "غرفة خادمة": "Maid's room", "حديقة": "Garden", "انتركم": "Intercom", "سكنية": "Residential", "زراعية": "Agricultural",
  "استثمارية": "Investment", "تجارية": "Commercial", "ماء": "Water", "كهرباء": "Electricity", "أقساط": "Instalments", "كاش": "Cash",
};

interface Props {
  ad: AdCard;
  locale: Locale;
  /** "row" is the wide card used on listing pages; it stacks like "grid" on phones. */
  layout?: "grid" | "row";
  priority?: boolean;
}

/**
 * Photo sizes are fixed in both layouts (4:3 in the grid and on phones, a
 * 320x290 box in wide rows), so every card lines up whatever its text length.
 */
export default function AdCardView({ ad, locale, layout = "grid", priority = false }: Props) {
  const t = dict(locale);
  const href = adPath(locale, ad);
  const location = adLocation(ad, locale);
  const period = pricePeriod(ad.price, ad.deal, locale);
  const images = ad.images?.length ? ad.images : ad.image ? [ad.image] : [];
  const row = layout === "row";
  // Rents above the threshold are yearly figures; the monthly equivalent keeps cards comparable
  const tags = (ad.tags ?? []).map((tag) => (locale === "en" ? TAGS_EN[tag] ?? tag : tag));
  const yearlyRent = ad.deal === "rent" && ad.price != null && monthlyPrice(ad.price, ad.deal) !== ad.price;

  const specs = [
    ad.bedrooms != null && {
      icon: "bed",
      text: ad.bedrooms === 0 ? t.studio : row ? (ad.bedrooms === 1 ? t.bedroom_one : `${ad.bedrooms} ${t.bedrooms}`) : String(ad.bedrooms),
    },
    ad.bathrooms != null && { icon: "bath", text: row ? `${ad.bathrooms} ${t.bathrooms}` : String(ad.bathrooms) },
    ad.area != null && ad.area > 0 && { icon: "area", text: `${Math.round(ad.area)} ${t.sqm}` },
    // Some ads already say "طابق ثاني"; only bare values like "3" get the word added
    row && ad.floor && { icon: "stairs", text: /طابق|floor|روف|تسوية/i.test(String(ad.floor)) ? String(ad.floor) : `${t.floor} ${ad.floor}` },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-line bg-white transition hover:border-brand-200 hover:shadow-lift ${
        row ? "md:grid md:h-[292px] md:grid-cols-[320px_minmax(0,1fr)]" : "flex h-full flex-col"
      }`}
    >
      <div className={`relative overflow-hidden bg-surface ${row ? "aspect-[4/3] md:aspect-auto md:h-[290px]" : "aspect-[4/3]"}`}>
        {images.length > 0 ? (
          <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
            <CardGallery images={images} alt={ad.title} priority={priority} />
          </Link>
        ) : (
          <div className="flex h-full items-center justify-center text-line">
            <Icon name="building" size={48} />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {ad.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-md bg-star px-2 py-1 text-xs font-bold text-ink">
                <Icon name="star" size={12} fill="currentColor" />
                {locale === "en" ? "Featured" : "مميز"}
              </span>
            )}
            {ad.is_hot && <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-white">{locale === "en" ? "Hot deal" : "لقطة"}</span>}
            {ad.below_market && <span className="rounded-md bg-white/95 px-2 py-1 text-xs font-bold text-success">{locale === "en" ? "Below market" : "أقل من السوق"}</span>}
            {ad.is_organic && (
              <span className="rounded-md bg-success px-2 py-1 text-xs font-semibold text-white">{locale === "en" ? "Direct" : "معلن مباشر"}</span>
            )}
          </div>
          {ad.images_count > 1 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-ink/70 px-2 py-1 text-xs font-semibold text-white">
              <Icon name="camera" size={13} />
              {ad.images_count}
            </span>
          )}
        </div>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col p-4 ${row ? "md:overflow-hidden md:px-5" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <span className={`font-bold text-ink ${row ? "text-[22px]" : "text-xl"}`}>{formatPrice(ad.price, locale)}</span>
            {period && <span className="text-sm text-muted">{period}</span>}
            {yearlyRent && <span className="text-xs text-muted">{t.monthly_equiv(formatPrice(Math.round((ad.price as number) / 12), locale))}</span>}
          </p>
          {ad.reviews_count > 0 && ad.rating_avg != null && (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink">
              <Icon name="star" size={15} className="text-star" fill="currentColor" />
              {ad.rating_avg.toFixed(1)}
              <span className="font-normal text-muted">({ad.reviews_count})</span>
            </span>
          )}
        </div>

        <h3 className={`mt-1 font-semibold leading-snug text-ink ${row ? "line-clamp-2 text-[17px] md:line-clamp-1" : "line-clamp-2 min-h-[2.75em] text-[15px]"}`}>
          <Link href={href} className="hover:text-brand-600">
            {ad.title}
          </Link>
        </h3>

        {location && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <Icon name="pin" size={15} className="shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}

        {specs.length > 0 && (
          <ul className={`mt-3 flex items-center gap-x-4 gap-y-1.5 text-sm font-medium text-body ${row ? "flex-wrap md:h-6 md:flex-nowrap md:overflow-hidden" : "flex-wrap"}`}>
            {specs.map((spec) => (
              <li key={spec.icon} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                <Icon name={spec.icon} size={17} className="text-muted" />
                {spec.text}
              </li>
            ))}
          </ul>
        )}

        {tags.length > 0 && (
          <ul className={`mt-3 flex gap-1.5 overflow-hidden ${row ? "flex-wrap md:h-[26px]" : "h-[26px] flex-wrap"}`}>
            {tags.map((tag) => (
              <li key={tag} className="inline-flex h-[26px] shrink-0 items-center whitespace-nowrap rounded-full border border-line bg-surface px-2.5 text-xs font-semibold text-body">
                {tag}
              </li>
            ))}
          </ul>
        )}

        {row && ad.excerpt && (
          <p className="mt-2.5 hidden text-sm leading-6 text-muted md:line-clamp-1 min-[1700px]:line-clamp-1" dir="auto">
            {ad.excerpt}
          </p>
        )}

        <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-muted">
          <Icon name="clock" size={14} />
          {timeAgo(ad.created_at, locale)}
        </p>
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          <CardContact
            phone={ad.phone}
            chatUrl={`${SHARE_URL}/ad/${ad.id}`}
            labels={{ showNumber: locale === "en" ? "Show number" : "إظهار الرقم", chat: locale === "en" ? "Chat" : "محادثة" }}
            sideBySide
          />
        </div>
      </div>
    </article>
  );
}
