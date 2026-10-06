import { Cairo } from "next/font/google";
import { type ReactNode, Suspense } from "react";
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
    <html lang={locale} dir={dict(locale).dir} className={cairo.variable} suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <Header locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
