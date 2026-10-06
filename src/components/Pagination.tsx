import Link from "next/link";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export default function Pagination({
  locale,
  page,
  totalPages,
  hrefFor,
}: {
  locale: Locale;
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const t = dict(locale);
  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const ordered = [...pages].sort((a, b) => a - b);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={t.page_of(page, totalPages)}>
      {page > 1 && (
        <Link href={hrefFor(page - 1)} rel="prev" className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-3.5 text-sm font-semibold transition border-line bg-white text-ink hover:border-brand-600 hover:text-brand-700">{t.prev}</Link>
      )}
      {ordered.map((p, index) => (
        <span key={p} className="flex items-center gap-2">
          {index > 0 && p - ordered[index - 1] > 1 && <span className="text-muted">…</span>}
          {p === page ? (
            <span aria-current="page" className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-3.5 text-sm font-semibold transition border-brand-600 bg-brand-600 text-white">{p}</span>
          ) : (
            <Link href={hrefFor(p)} className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-3.5 text-sm font-semibold transition border-line bg-white text-ink hover:border-brand-600 hover:text-brand-700">{p}</Link>
          )}
        </span>
      ))}
      {page < totalPages && (
        <Link href={hrefFor(page + 1)} rel="next" className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-3.5 text-sm font-semibold transition border-line bg-white text-ink hover:border-brand-600 hover:text-brand-700">{t.next}</Link>
      )}
    </nav>
  );
}
