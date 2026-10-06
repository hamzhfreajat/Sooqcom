import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";
import Icon from "./Icon";
import JsonLd from "./JsonLd";

export interface Crumb {
  name: string;
  path: string;
}

/** The last crumb is the current page. Also emits the matching structured data. */
export default function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav aria-label={label} className="no-scrollbar overflow-x-auto">
      <ol className="flex items-center gap-1.5 whitespace-nowrap text-[13px] text-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 && <Icon name="chevron" size={14} className="rtl:rotate-180" />}
              {last ? (
                <span aria-current="page" className="font-semibold text-ink">{item.name}</span>
              ) : (
                <Link href={item.path} className="hover:text-brand-700">{item.name}</Link>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </nav>
  );
}
