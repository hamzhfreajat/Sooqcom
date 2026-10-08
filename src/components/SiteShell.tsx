import { Cairo } from "next/font/google";
import Script from "next/script";
import { type ReactNode, Suspense } from "react";
import { GA_MEASUREMENT_ID, GOOGLE_CLIENT_ID, HTML_LANG } from "@/lib/config";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
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
        {/* Loaded after the page is usable, and only when a measurement id is configured */}
        {/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
