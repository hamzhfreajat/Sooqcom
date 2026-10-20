import { Cairo } from "next/font/google";
import Script from "next/script";
import { type ReactNode, Suspense } from "react";
import { GA_MEASUREMENT_IDS, GOOGLE_CLIENT_ID, HTML_LANG } from "@/lib/config";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import AdImpressions from "./AdImpressions";
import Footer from "./Footer";
import Header from "./Header";
import NavProgress from "./NavProgress";

// Cairo is the typeface of the mobile app, so the two feel like one product
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-brand",
  display: "swap",
});

/** The document shell shared by both languages; each language has its own root layout. */
export default function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    // Browser extensions add their own attributes to <html> and <body>; those are not hydration errors
    <html lang={HTML_LANG[locale]} dir={dict(locale).dir} className={cairo.variable} suppressHydrationWarning>
      <body className="min-h-screen" data-google-client-id={GOOGLE_CLIENT_ID || undefined} suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <Header locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
        {/* Counts the ads seen in lists, as the app does */}
        <AdImpressions />
        {/* Loaded once the page has finished loading and the phone is idle, and only when a measurement
            id is configured: started earlier, it held up a visitor's first tap by over a second on a phone */}
        {GA_MEASUREMENT_IDS.length > 0 && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_IDS[0]}`} strategy="lazyOnload" />
            {/* The setup only queues commands, so it runs early: events from a first tap are kept */}
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${GA_MEASUREMENT_IDS.map((id) => `gtag('config','${id}');`).join("")}`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
