"use client";

import type { Locale } from "@/lib/types";

/**
 * Links to the same page in the other language. Each page declares its
 * translation in <link rel="alternate" hreflang>, so that is read on click;
 * the plain href (the other language's home) is the fallback.
 */
export default function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const target: Locale = locale === "en" ? "ar" : "en";
  return (
    <a
      href={target === "en" ? "/en" : "/"}
      hrefLang={target}
      aria-label={label}
      lang={target}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-body hover:bg-surface"
      onClick={(event) => {
        const alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang^="${target}"]`);
        if (alternate?.href) {
          event.preventDefault();
          window.location.href = alternate.href;
        }
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.500 2.500 3.800 5.500 3.800 9s-1.300 6.500-3.800 9c-2.500-2.500-3.800-5.500-3.800-9S9.500 5.500 12 3Z" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
