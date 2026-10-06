import Link from "next/link";
import { Suspense } from "react";
import { getTaxonomy } from "@/lib/api";
import { filterOptions } from "@/lib/filters";
import { dict } from "@/lib/i18n";
import { DEALS, homePath, listingPath, postPath, typesForDeal } from "@/lib/taxonomy";
import type { Deal, Locale } from "@/lib/types";
import AccountButton from "./AccountButton";
import { buildListingUrl, childCategories } from "./filters/shared";
import Icon from "./Icon";
import LanguageSwitch from "./LanguageSwitch";
import MegaMenu, { type Menu, type MenuNode } from "./MegaMenu";
import MobileMenu from "./MobileMenu";

const DEAL_ORDER: Deal[] = ["rent", "sale"];

/**
 * The two menus with the whole real-estate category tree, every level of it.
 * If the categories cannot be loaded, the menus fall back to the main property types.
 */
async function buildMenus(locale: Locale, dealTitle: (deal: Deal) => string): Promise<Menu[]> {
  const t = dict(locale);
  try {
    // The page must not hang on its header: after a few seconds the short menu is used instead
    const taxonomy = await Promise.race([getTaxonomy(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("slow")), 4000))]);
    const options = filterOptions(locale, taxonomy);
    return DEAL_ORDER.map((deal) => {
      const slug = DEALS[deal].slug[locale];
      const node = (id: number, name: string): MenuNode => ({
        id,
        name,
        href: buildListingUrl(options, { deal: slug, cat: id }),
        children: childCategories(options.categories, id).map((child) => node(child.id, child.name)),
      });
      return {
        key: deal,
        label: deal === "rent" ? t.nav_rent : t.nav_sale,
        allLabel: dealTitle(deal),
        href: listingPath(locale, { deal }),
        groups: childCategories(options.categories, DEALS[deal].id).map((group) => node(group.id, group.name)),
      };
    });
  } catch {
    return DEAL_ORDER.map((deal) => ({
      key: deal,
      label: deal === "rent" ? t.nav_rent : t.nav_sale,
      allLabel: dealTitle(deal),
      href: listingPath(locale, { deal }),
      groups: typesForDeal(deal).map((type) => ({ id: type.ids[deal] as number, name: type.label[locale], href: listingPath(locale, { deal, type }), children: [] })),
    }));
  }
}

export default async function Header({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const prefix = locale === "en" ? "/en" : "";
  const dealTitle = (deal: Deal) => (locale === "en" ? `${t.properties} ${DEALS[deal].label.en}` : `${t.properties} ${DEALS[deal].label.ar}`);
  const menus = await buildMenus(locale, dealTitle);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgb(11_18_32/0.05)]">
      <div className="container-page flex h-[68px] items-center gap-1.5">
        <MobileMenu
          label={locale === "en" ? "Menu" : "القائمة"}
          // One block per main group of each deal, listing the categories under it
          sections={menus.flatMap((menu) =>
            menu.groups.map((group) => ({
              title: `${group.name} · ${menu.label}`,
              href: group.href,
              links: group.children.map((child) => ({ href: child.href, label: child.name, icon: "chevron" })),
            })),
          )}
          extra={[
            { href: `${prefix}/account`, label: locale === "en" ? "My ads" : "إعلاناتي" },
            { href: `${prefix}/about`, label: t.nav_about },
            { href: `${prefix}/privacy`, label: t.privacy },
          ]}
        />

        <Link href={homePath(locale)} className="flex items-center gap-2.5" aria-label={t.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-96.png" alt="" width={38} height={38} className="h-[38px] w-[38px]" />
          <span className="text-xl font-bold text-ink sm:text-[22px]">{t.brand}</span>
        </Link>

        {/* The menus read the address to close themselves after a click, which needs a boundary on prerendered pages */}
        <Suspense fallback={null}>
          <MegaMenu menus={menus} viewAll={t.view_all} />
        </Suspense>
        <Link href={`${prefix}/about`} className="hidden rounded-lg px-3.5 py-2.5 text-[15px] font-semibold text-ink hover:bg-surface lg:block">
          {t.nav_about}
        </Link>

        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitch locale={locale} label={t.language} />
          <AccountButton locale={locale} />
          <Link href={postPath(locale)} className="btn-primary ms-1 h-11 whitespace-nowrap px-3.5 sm:px-5">
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">{t.post_ad}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
