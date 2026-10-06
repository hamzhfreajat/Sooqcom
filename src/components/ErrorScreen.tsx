"use client";

import { useEffect, useState } from "react";

interface Props {
  locale: "ar" | "en";
  /** Loads the page again without leaving it */
  reset: () => void;
}

const TEXT = {
  ar: { title: "تعذّر تحميل الصفحة", body: "حدث تأخير في جلب الإعلانات. حاول مرة أخرى بعد لحظات.", retry: "إعادة المحاولة", home: "العودة للرئيسية", trying: "جارٍ التحميل…" },
  en: { title: "This page could not be loaded", body: "Fetching the listings took too long. Please try again in a moment.", retry: "Try again", home: "Back to home", trying: "Loading…" },
};

/** Shown in place of a page whose data could not be fetched, instead of a bare error. */
export default function ErrorScreen({ locale, reset }: Props) {
  const t = TEXT[locale];
  const [trying, setTrying] = useState(false);

  useEffect(() => {
    if (!trying) return;
    const timer = setTimeout(() => setTrying(false), 15_000);
    return () => clearTimeout(timer);
  }, [trying]);

  return (
    <div className="container-page py-20 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12a8 8 0 0 1 13.700-5.600L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.700 5.600L4 16M4 20v-4h4" />
        </svg>
      </span>
      <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{t.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">{t.body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          disabled={trying}
          onClick={() => {
            setTrying(true);
            reset();
          }}
          className="btn-primary h-11 px-6"
        >
          {trying ? t.trying : t.retry}
        </button>
        <a href={locale === "en" ? "/en" : "/"} className="btn-outline h-11 px-6">
          {t.home}
        </a>
      </div>
    </div>
  );
}
