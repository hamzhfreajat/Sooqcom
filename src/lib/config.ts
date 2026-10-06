export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sooq-com.com").replace(/\/$/, "");
export const API_URL = (process.env.API_URL || "https://api.sooq-com.com/api").replace(/\/$/, "");

export const SITE_NAME = { ar: "سوقكم", en: "Sooqcom" } as const;

export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.sooqcom.app";
export const APP_STORE_URL = "https://apps.apple.com/app/sooqcom-%D8%B3%D9%88%D9%82%D9%83%D9%85/id6785620545";
export const SHARE_URL = "https://share.sooq-com.com";

/** Pages are rebuilt in the background at most this often (seconds). */
export const REVALIDATE_SECONDS = 300;

/** A listing page needs at least this many ads before search engines may index it. */
export const MIN_ADS_TO_INDEX = 3;

export const PAGE_SIZE = 24;
