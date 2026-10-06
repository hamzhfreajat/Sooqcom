import Link from "next/link";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/config";
import { dict } from "@/lib/i18n";
import { DEALS, homePath, listingPath, typesForDeal } from "@/lib/taxonomy";
import type { Deal, Locale } from "@/lib/types";

export default function Footer({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const prefix = locale === "en" ? "/en" : "";
  const dealLinks = (deal: Deal) =>
    typesForDeal(deal)
      .slice(0, 7)
      .map((type) => ({
        href: listingPath(locale, { deal, type }),
        label: locale === "en" ? `${type.label.en} ${DEALS[deal].label.en}` : `${type.label.ar} ${DEALS[deal].label.ar}`,
      }));

  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href={homePath(locale)} className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-96.png" alt="" width={36} height={36} className="h-9 w-9" loading="lazy" />
            <span className="text-xl font-black text-ink">{t.brand}</span>
          </Link>
          <p className="mt-4 text-sm leading-7 text-muted">{t.footer_about}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={PLAY_STORE_URL} rel="noopener" className="btn-outline px-4 py-2">Google Play</a>
            <a href={APP_STORE_URL} rel="noopener" className="btn-outline px-4 py-2">App Store</a>
          </div>
        </div>

        {(["rent", "sale"] as Deal[]).map((deal) => (
          <nav key={deal} aria-label={DEALS[deal].label[locale]}>
            <h2 className="text-sm font-extrabold text-ink">
              {locale === "en" ? `${t.properties} ${DEALS[deal].label.en}` : `${t.properties} ${DEALS[deal].label.ar}`}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {dealLinks(deal).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted hover:text-brand-700">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <nav aria-label={t.footer_company}>
          <h2 className="text-sm font-extrabold text-ink">{t.footer_company}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href={`${prefix}/about`} className="text-muted hover:text-brand-700">{t.nav_about}</Link></li>
            <li><Link href={`${prefix}/privacy`} className="text-muted hover:text-brand-700">{t.privacy}</Link></li>
            <li><Link href={`${prefix}/delete-data`} className="text-muted hover:text-brand-700">{t.delete_data}</Link></li>
            <li><a href="mailto:support@sooq-com.com" className="text-muted hover:text-brand-700" dir="ltr">support@sooq-com.com</a></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} {t.brand}. {t.rights}.
        </p>
      </div>
    </footer>
  );
}
