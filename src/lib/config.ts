export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sooq-com.com").replace(/\/$/, "");
export const API_URL = (process.env.API_URL || "https://api.sooq-com.com/api").replace(/\/$/, "");

export const SITE_NAME = { ar: "سوقكم", en: "Sooqcom" } as const;

// ---------------------------------------------------------------------------
// Search-engine settings, in one place
// ---------------------------------------------------------------------------
/** The site is written for Jordan: language tags carry the country so search engines know it. */
export const HTML_LANG = { ar: "ar-JO", en: "en-JO" } as const;
export const HREFLANG = { ar: "ar-JO", en: "en-JO" } as const;
/** Open Graph only knows a fixed list of locales; there is no English one for Jordan. */
export const OG_LOCALE = { ar: "ar_JO", en: "en_US" } as const;
export const COUNTRY = { code: "JO", name: { ar: "الأردن", en: "Jordan" } } as const;
/** Shown when a page is shared and has no photo of its own. */
export const DEFAULT_OG_IMAGE = { url: "/logo-512.png", width: 512, height: 512 } as const;
export const SUPPORT_EMAIL = "support@sooq-com.com";

/** Ownership codes from Google Search Console and Bing Webmaster Tools ("HTML tag" method). Empty until set. */
export const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || "";
export const BING_SITE_VERIFICATION = process.env.BING_SITE_VERIFICATION || "";
/**
 * A setting as the running server sees it. `process.env.NEXT_PUBLIC_X` written out in full is fixed
 * when the site is built; looked up by name it is read when the server starts, so the host can
 * change it without a build argument. Empty in the browser.
 */
const serverSetting = (name: string) => (typeof window === "undefined" ? process.env[name] || "" : "");
/** Google Analytics 4 measurement id ("G-XXXXXXX"). Nothing is loaded while it is empty. */
export const GA_MEASUREMENT_ID = serverSetting("NEXT_PUBLIC_GA_ID") || process.env.NEXT_PUBLIC_GA_ID || "";
/** Google sign-in client id. The page shell hands it to the browser, where the sign-in button reads it. */
export const GOOGLE_CLIENT_ID = serverSetting("NEXT_PUBLIC_GOOGLE_CLIENT_ID") || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.sooqcom.app";
export const APP_STORE_URL = "https://apps.apple.com/app/sooqcom-%D8%B3%D9%88%D9%82%D9%83%D9%85/id6785620545";
export const SHARE_URL = "https://share.sooq-com.com";

/** Pages are rebuilt in the background at most this often (seconds). */
export const REVALIDATE_SECONDS = 300;

/** A listing page needs at least this many ads before search engines may index it. */
export const MIN_ADS_TO_INDEX = 3;

export const PAGE_SIZE = 24;
