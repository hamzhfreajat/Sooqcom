import Link from "next/link";
import Icon from "@/components/Icon";
import { dict } from "@/lib/i18n";
import { homePath, listingPath } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";

export default function NotFoundView({ locale }: { locale: Locale }) {
  const t = dict(locale);
  return (
    <div className="container-page py-20 text-center">
      <Icon name="search" size={48} className="mx-auto text-line" />
      <h1 className="mt-5 text-3xl font-black">{t.not_found_title}</h1>
      <p className="mt-3 text-muted">{t.not_found_body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={homePath(locale)} className="btn-primary">{t.back_home}</Link>
        <Link href={listingPath(locale, { deal: "rent" })} className="btn-outline">{t.nav_rent}</Link>
        <Link href={listingPath(locale, { deal: "sale" })} className="btn-outline">{t.nav_sale}</Link>
      </div>
    </div>
  );
}
