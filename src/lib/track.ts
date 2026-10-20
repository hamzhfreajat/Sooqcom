/**
 * Counts what visitors do with an ad, into the same counters the app keeps: views (the ad
 * seen in a list, or its page opened) and contacts (phone number shown, WhatsApp or chat
 * opened). Browser only.
 *
 * Sent with navigator.sendBeacon straight to the API: no CORS preflight, and it still
 * goes out when the visitor leaves the page (a tap on "tel:" or WhatsApp does exactly that).
 * Each ad and action is sent once a day per browser, so reloading a page counts once.
 */
import { type KeyEvent, gaEvent } from "./analytics";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://api.sooq-com.com/api").replace(/\/$/, "");
const STORE_KEY = "sooq:ad-events";
const DAY = 86_400_000;
// A day of browsing lists can show many hundreds of ads
const MAX_REMEMBERED = 1500;

export type AdEvent = "seen" | "phone" | "whatsapp" | "chat";

function remembered(): Record<string, number> {
  try {
    const value = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

const canSend = () => typeof window !== "undefined" && typeof navigator.sendBeacon === "function";

/** The keys not sent in the last day. */
function fresh(keys: string[]): string[] {
  const sent = remembered();
  const now = Date.now();
  return keys.filter((key) => !sent[key] || now - sent[key] >= DAY);
}

/** Notes the keys as sent, keeping only the last day's entries and not too many of them. */
function remember(keys: string[]): void {
  const now = Date.now();
  const sent = remembered();
  for (const key of keys) sent[key] = now;
  const kept = Object.entries(sent)
    .filter(([, at]) => now - at < DAY)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_REMEMBERED);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // Private browsing or storage full: the event was still sent
  }
}

// Contacts also go to Google Analytics, as key events: every click, not once a day
const KEY_EVENTS: Partial<Record<AdEvent, KeyEvent>> = { phone: "phone_reveal", whatsapp: "whatsapp_click", chat: "chat_click" };

export function trackAd(adId: number, event: AdEvent): void {
  const keyEvent = KEY_EVENTS[event];
  if (keyEvent) gaEvent(keyEvent, { ad_id: adId });
  if (!canSend()) return;
  const key = `${adId}:${event}`;
  if (!fresh([key]).length) return;
  const path = event === "seen" ? "seen" : `contact/${event}`;
  try {
    navigator.sendBeacon(`${API}/web/ads/${adId}/${path}`);
  } catch {
    return;
  }
  remember([key]);
}

/** Ads seen in a list, sent together as "61000,61001" (plain text: no preflight). */
export function trackShown(adIds: number[]): void {
  if (!canSend() || !adIds.length) return;
  const keys = fresh(adIds.map((id) => `${id}:shown`));
  if (!keys.length) return;
  try {
    navigator.sendBeacon(`${API}/web/ads/shown`, new Blob([keys.map((key) => key.split(":")[0]).join(",")], { type: "text/plain" }));
  } catch {
    return;
  }
  remember(keys);
}
