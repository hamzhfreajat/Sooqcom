import Link from "next/link";
import { SHARE_URL } from "@/lib/config";
import { adLocation, formatPrice, monthlyPrice, pricePeriod, timeAgo } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { adPath } from "@/lib/taxonomy";
import type { AdCard, Locale } from "@/lib/types";
import { TAGS_EN } from "./AdCardView";
import CardContact from "./CardContact";
import CardGallery from "./CardGallery";
import Icon from "./Icon";

/**
 * The listing page's card, in three fixed zones on wide screens: photo, details,
 * and a price-and-contact column. Every card has the same height and the same
 * zone widths, so a page of them reads as one even table. On phones the zones stack.
 */
export default function AdRowCard({ ad, locale, priority = false }: { ad: AdCard; locale: Locale; priority?: boolean }) {
  const t = dict(locale);
  const en = locale === "en";
  const href = adPath(locale, ad);
  const location = adLocation(ad, locale);
  const period = pricePeriod(ad.price, ad.deal, locale);
  const images = ad.images?.length ? ad.images : ad.image ? [ad.image] : [];
  const tags = (ad.tags ?? []).map((tag) => (en ? TAGS_EN[tag] ?? tag : tag));
  // Rents above the threshold are yearly figures; the monthly equivalent keeps cards comparable
  const yearlyRent = ad.deal === "rent" && ad.price != null && monthlyPrice(ad.price, ad.deal) !== ad.price;

  const specs = [
    ad.bedrooms != null && { icon: "bed", text: ad.bedrooms === 0 ? t.studio : ad.bedrooms === 1 ? t.bedroom_one : `${ad.bedrooms} ${t.bedrooms}` },
    ad.bathrooms != null && { icon: "bath", text: `${ad.bathrooms} ${t.bathrooms}` },
    ad.area != null && ad.area > 0 && { icon: "area", text: `${Math.round(ad.area)} ${t.sqm}` },
    // Some ads already say "طابق ثاني"; only bare values like "3" get the word added
    ad.floor && { icon: "stairs", text: /طابق|floor|روف|تسوية/i.test(String(ad.floor)) ? String(ad.floor) : `${t.floor} ${ad.floor}` },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <article className="group overflow-hidden rounded-[20px] border border-line bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift md:grid md:h-[264px] md:grid-cols-[300px_minmax(0,1fr)_216px] md:grid-rows-[minmax(0,1fr)_auto] xl:grid-cols-[340px_minmax(0,1fr)_232px]">
      {/* Zone 1: photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface md:col-start-1 md:row-span-2 md:row-start-1 md:m-2.5 md:aspect-auto md:h-[242px] md:rounded-[14px]">
        {images.length > 0 ? (
          <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full transition duration-500 ease-out group-hover:scale-[1.04]">
            <CardGallery
              images={images}
              alt={ad.title}
              priority={priority}
              viewer={{
                detailsHref: href,
                labels: {
                  enlarge: en ? "Enlarge photos" : "تكبير الصور",
                  close: t.close,
                  details: en ? "View the listing" : "عرض تفاصيل الإعلان",
                  previous: en ? "Previous photo" : "الصورة السابقة",
                  next: en ? "Next photo" : "الصورة التالية",
                },
              }}
            />
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
                {en ? "Featured" : "مميز"}
              </span>
            )}
            {ad.is_hot && <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-white">{en ? "Hot deal" : "لقطة"}</span>}
            {ad.below_market && <span className="rounded-md bg-white/95 px-2 py-1 text-xs font-bold text-success">{en ? "Below market" : "أقل من السوق"}</span>}
            {ad.is_organic && <span className="rounded-md bg-success px-2 py-1 text-xs font-semibold text-white">{en ? "Direct" : "معلن مباشر"}</span>}
          </div>
          {ad.images_count > 1 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-ink/70 px-2 py-1 text-xs font-semibold text-white">
              <Icon name="camera" size={13} />
              {ad.images_count}
            </span>
          )}
        </div>
      </div>

      {/* Zone 3 (top): price. It comes before the details so it leads on phones */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 pt-4 md:col-start-3 md:row-start-1 md:block md:border-s md:border-line md:px-5 md:pt-5">
        <p className="hidden text-xs font-medium text-muted md:block">{en ? "Price" : "السعر"}</p>
        <p className="text-[26px] font-bold leading-tight text-brand-700 md:mt-0.5">{formatPrice(ad.price, locale)}</p>
        {period && <p className="text-sm text-muted md:mt-0.5">{period}</p>}
        {yearlyRent && <p className="text-xs text-muted md:mt-1">{t.monthly_equiv(formatPrice(Math.round((ad.price as number) / 12), locale))}</p>}
        {ad.reviews_count > 0 && ad.rating_avg != null && (
          <p className="ms-auto inline-flex items-center gap-1 text-sm font-semibold text-ink md:ms-0 md:mt-3">
            <Icon name="star" size={15} className="text-star" fill="currentColor" />
            {ad.rating_avg.toFixed(1)}
            <span className="font-normal text-muted">({ad.reviews_count})</span>
          </p>
        )}
      </div>

      {/* Zone 2: details */}
      <div className="flex min-w-0 flex-col px-4 pt-2 md:col-start-2 md:row-span-2 md:row-start-1 md:overflow-hidden md:px-5 md:py-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate rounded-md bg-brand-50 px-2 py-1 font-semibold text-brand-700">{ad.category_name}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-muted">
            <Icon name="clock" size={13} />
            {timeAgo(ad.created_at, locale)}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-[17px] font-bold leading-snug text-ink md:line-clamp-1 md:text-[19px]">
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
          <ul className="mt-3.5 flex flex-wrap items-center gap-y-1.5 text-sm font-medium text-ink md:h-6 md:flex-nowrap md:overflow-hidden">
            {specs.map((spec, i) => (
              <li key={spec.icon} className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap ${i > 0 ? "ms-3.5 border-s border-line ps-3.5" : ""}`}>
                <Icon name={spec.icon} size={18} className="text-muted" />
                {spec.text}
              </li>
            ))}
          </ul>
        )}

        {ad.excerpt && (
          <p className="mt-3 hidden text-sm leading-6 text-muted md:line-clamp-2" dir="auto">
            {ad.excerpt}
          </p>
        )}

        {tags.length > 0 && (
          <ul className="mt-3.5 flex flex-wrap gap-1.5 overflow-hidden md:mt-auto md:h-[28px] md:shrink-0">
            {tags.map((tag) => (
              <li key={tag} className="inline-flex h-[28px] shrink-0 items-center whitespace-nowrap rounded-full border border-line px-3 text-xs font-medium text-body">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Zone 3 (bottom): contact */}
      <div className="flex gap-2 p-4 md:col-start-3 md:row-start-2 md:flex-col md:gap-2.5 md:border-s md:border-line md:px-5 md:pb-5 md:pt-0">
        <CardContact
          phone={ad.phone}
          chatUrl={`${SHARE_URL}/ad/${ad.id}`}
          labels={{ showNumber: en ? "Show number" : "إظهار الرقم", chat: en ? "Chat" : "محادثة" }}
        />
      </div>
    </article>
  );
}
