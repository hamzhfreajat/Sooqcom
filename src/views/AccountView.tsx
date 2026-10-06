"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { type SessionUser, fetchSession, onSessionChange, requestLogin } from "@/components/AccountButton";
import Icon from "@/components/Icon";

interface Summary {
  totalAds: number; activeAds: number; expiredAds: number; pendingAds: number; soldAds: number; pausedAds: number; boostedAds: number;
  totalViews: number; totalChats: number; totalFavorites: number;
}

interface MyAd {
  id: number; title: string; price: number; image: string | null; photos: number; location: string | null; category: string | null; status: string;
  views: number; chats: number; favorites: number; rating: number | null; reviews: number; score: number; hint: string | null;
  createdAt: string | null; republishedAt: string | null;
}

type Lang = "ar" | "en";
const STATUSES = ["All", "Active", "Uncompleted", "Expired", "Sold", "Paused"] as const;

const TEXT = {
  ar: {
    title: "إعلاناتي", subtitle: "تابع أداء إعلاناتك وأدرها من مكان واحد.", post: "أضف إعلاناً", stats: "مؤشرات الأداء", ads: "الإعلانات", views: "المشاهدات", chats: "المراسلات",
    favorites: "المفضلة", perAd: "لكل إعلان", status: { All: "الكل", Active: "نشط", Uncompleted: "غير مكتمل", Expired: "منتهية", Sold: "مباعة", Paused: "متوقفة", Rejected: "مرفوض" } as Record<string, string>,
    search: "ابحث في إعلاناتك...", empty: "لم تقم بنشر أي إعلانات بعد. ابدأ الآن!", emptyFilter: "لا توجد إعلانات بهذه الحالة.", view: "عرض", pause: "إيقاف", resume: "تفعيل", sold: "تم البيع",
    republish: "إعادة النشر", remove: "حذف", confirmDelete: "هل تريد حذف هذا الإعلان نهائياً؟", done: "تم تنفيذ العملية بنجاح", failed: "حدث خطأ أثناء التنفيذ",
    already: "هذا الإعلان تم إعادة نشره بالفعل وهو الآن في أعلى القائمة", published: "تاريخ النشر", score: "قوة الإعلان", top: "الأكثر مشاهدة", loginTitle: "سجّل الدخول لعرض إعلاناتك",
    loginBody: "حسابك على الموقع هو نفسه حسابك في التطبيق.", login: "تسجيل الدخول", currency: "د.أ", photos: "صور", reviews: "تقييم", selected: (n: number) => `تم تحديد ${n}`,
    hints: { "Price might be slightly high.": "قد يكون السعر مرتفعاً قليلاً.", "Add more photos to increase trust.": "أضف صوراً أكثر لزيادة الثقة." } as Record<string, string>,
    tipNone: "أضف إعلانك الأول للبدء بمتابعة التفاعل.", tipInactive: "ليس لديك إعلانات نشطة. قم بالتجديد الآن!", tipExpired: (n: number) => `${n} إعلانات منتهية. جددها اليوم.`,
    tipPending: (n: number) => `${n} إعلانات غير مكتملة.`, tipGood: "أداء حسابك ممتاز. استمر في نشر المزيد من الإعلانات!", appOnly: "تعديل الإعلان وترويجه متاحان حالياً من التطبيق.",
  },
  en: {
    title: "My ads", subtitle: "Follow how your ads perform and manage them in one place.", post: "Post an ad", stats: "Performance", ads: "Ads", views: "Views", chats: "Chats",
    favorites: "Favourites", perAd: "per ad", status: { All: "All", Active: "Active", Uncompleted: "Incomplete", Expired: "Expired", Sold: "Sold", Paused: "Paused", Rejected: "Rejected" } as Record<string, string>,
    search: "Search your ads…", empty: "You have not posted any ads yet. Start now!", emptyFilter: "No ads with this status.", view: "View", pause: "Pause", resume: "Activate", sold: "Mark as sold",
    republish: "Republish", remove: "Delete", confirmDelete: "Delete this ad permanently?", done: "Done", failed: "Something went wrong",
    already: "This ad was already republished and is at the top of the list", published: "Posted", score: "Ad strength", top: "Most viewed", loginTitle: "Sign in to see your ads",
    loginBody: "Your website account is the same as your app account.", login: "Sign in", currency: "JOD", photos: "photos", reviews: "reviews", selected: (n: number) => `${n} selected`,
    hints: {} as Record<string, string>,
    tipNone: "Post your first ad to start following its activity.", tipInactive: "You have no active ads. Renew them now!", tipExpired: (n: number) => `${n} ads have expired. Renew them today.`,
    tipPending: (n: number) => `${n} ads are incomplete.`, tipGood: "Your account is doing well. Keep posting!", appOnly: "Editing and promoting an ad are available in the app for now.",
  },
};

const STATUS_STYLE: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700", Uncompleted: "bg-amber-50 text-amber-700", Expired: "bg-surface text-muted", Sold: "bg-brand-50 text-brand-700",
  Paused: "bg-orange-50 text-orange-700", Rejected: "bg-red-50 text-red-700",
};

/** "My ads": the account's totals, the ads by status, and what can be done with each. Mirrors the app's screen. */
export default function AccountView({ locale }: { locale: Lang }) {
  const t = TEXT[locale];
  const prefix = locale === "en" ? "/en" : "";
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [ads, setAds] = useState<MyAd[] | null>(null);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async (nextStatus: string, nextSearch: string) => {
    const query = new URLSearchParams({ status: nextStatus });
    if (nextSearch.trim()) query.set("search", nextSearch.trim());
    const response = await fetch(`/api/account/ads?${query.toString()}`, { cache: "no-store" });
    if (response.status === 401) return setUser(null);
    if (!response.ok) return setAds([]);
    const data = await response.json();
    setSummary(data.summary);
    setAds(data.ads);
  }, []);

  useEffect(() => {
    fetchSession().then(setUser);
    return onSessionChange(setUser);
  }, []);
  useEffect(() => {
    if (!user) return;
    // Typing in the search box waits a moment before asking the server
    const timer = setTimeout(() => load(status, search), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [user, status, search, load]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const act = async (ids: number[], action: string) => {
    if (action === "delete" && !window.confirm(t.confirmDelete)) return;
    setBusy(true);
    const response = await fetch("/api/account/ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, action }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setToast(response.ok ? t.done : data.error === "already_republished" ? t.already : t.failed);
    if (response.ok) {
      setPicked([]);
      load(status, search);
    }
  };

  if (user === undefined) return <div className="mx-auto my-24 h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />;

  if (!user) {
    return (
      <div className="bg-surface">
        <div className="container-page py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-8 text-center shadow-card sm:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Icon name="user" size={28} /></span>
            <h1 className="mt-5 text-2xl font-bold">{t.loginTitle}</h1>
            <p className="mt-2.5 text-[15px] leading-7 text-muted">{t.loginBody}</p>
            <button type="button" onClick={requestLogin} className="btn-primary mt-7 h-12 w-full text-base">{t.login}</button>
          </div>
        </div>
      </div>
    );
  }

  const number = (value: number) => value.toLocaleString("en-US");
  const tip = !summary
    ? ""
    : summary.totalAds === 0
      ? t.tipNone
      : summary.activeAds === 0
        ? t.tipInactive
        : summary.expiredAds > 0
          ? t.tipExpired(summary.expiredAds)
          : summary.pendingAds > 0
            ? t.tipPending(summary.pendingAds)
            : t.tipGood;
  const counts: Record<string, number | undefined> = summary
    ? { All: summary.totalAds, Active: summary.activeAds, Uncompleted: summary.pendingAds, Expired: summary.expiredAds, Sold: summary.soldAds, Paused: summary.pausedAds }
    : {};
  const perAd = (value: number) => (summary && summary.totalAds ? Math.round(value / summary.totalAds) : 0);
  const top = [...(ads ?? [])].sort((a, b) => b.views - a.views).slice(0, 5).filter((ad) => ad.views > 0);
  const topMax = Math.max(1, ...top.map((ad) => ad.views));
  const kpis: [string, string, number, string][] = summary
    ? [
        ["layers", t.ads, summary.totalAds, `${summary.activeAds} ${t.status.Active}`],
        ["search", t.views, summary.totalViews, `${number(perAd(summary.totalViews))} ${t.perAd}`],
        ["chat", t.chats, summary.totalChats, `${number(perAd(summary.totalChats))} ${t.perAd}`],
        ["heart", t.favorites, summary.totalFavorites, `${number(perAd(summary.totalFavorites))} ${t.perAd}`],
      ]
    : [];

  return (
    <div className="min-h-[70vh] bg-surface">
      <div className="container-page py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon name="user" size={22} />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-bold leading-tight text-ink">{t.title}</h1>
              <p className="truncate text-sm text-muted">{user.name ? `${user.name} · ` : ""}{t.subtitle}</p>
            </div>
          </div>
          <Link href={`${prefix}/post`} className="btn-primary h-11 px-5">
            <Icon name="plus" size={17} />
            {t.post}
          </Link>
        </header>

        {/* Statistics */}
        <section id="stats" className="mt-5 scroll-mt-24" aria-labelledby="stats-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="stats-title" className="text-base font-bold text-ink">{t.stats}</h2>
            {tip && <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-card">{tip}</p>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map(([icon, label, value, note]) => (
              <div key={label} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">{label}</p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon name={icon} size={16} /></span>
                </div>
                <p className="mt-2 text-[28px] font-bold leading-none text-ink">{number(value)}</p>
                <p className="mt-1.5 text-xs text-muted">{note}</p>
              </div>
            ))}
            {!summary && [0, 1, 2, 3].map((i) => <div key={i} className="h-[112px] animate-pulse rounded-2xl bg-white" />)}
          </div>

          {top.length > 0 && (
            <div className="mt-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
              <h3 className="text-sm font-bold text-ink">{t.top}</h3>
              <ul className="mt-3 space-y-2.5">
                {top.map((ad) => (
                  <li key={ad.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 text-sm sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)_auto]">
                    <span className="truncate font-medium text-ink">{ad.title}</span>
                    <span className="order-last col-span-2 h-2 overflow-hidden rounded-full bg-surface sm:order-none sm:col-span-1">
                      <span className="block h-full rounded-full bg-brand-600" style={{ width: `${(ad.views / topMax) * 100}%` }} />
                    </span>
                    <span className="text-end text-xs font-semibold text-muted">{number(ad.views)} {t.views}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* The ads */}
        <section className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {STATUSES.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={status === key}
                  onClick={() => { setStatus(key); setPicked([]); setAds(null); }}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
                    status === key ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-body hover:border-ink"
                  }`}
                >
                  {t.status[key]}
                  {counts[key] !== undefined && <span className={`text-xs font-normal ${status === key ? "text-white/85" : "text-muted"}`}>{counts[key]}</span>}
                </button>
              ))}
            </div>
            <label className="relative w-full sm:w-72">
              <Icon name="search" size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} className="field h-10 ps-10 text-sm" />
            </label>
          </div>

          {picked.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm text-white">
              <span className="me-auto font-semibold">{t.selected(picked.length)}</span>
              {[["pause", t.pause], ["resume", t.resume], ["sold", t.sold], ["delete", t.remove]].map(([action, label]) => (
                <button key={action} type="button" disabled={busy} onClick={() => act(picked, action)} className={`rounded-lg px-3 py-1.5 font-semibold transition hover:bg-white/15 ${action === "delete" ? "text-red-300" : ""}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {ads === null && [0, 1, 2].map((i) => <div key={i} className="h-[132px] animate-pulse rounded-2xl bg-white" />)}
            {ads?.length === 0 && (
              <div className="rounded-2xl border border-line bg-white px-6 py-14 text-center shadow-card">
                <Icon name="layers" size={40} className="mx-auto text-line" />
                <p className="mt-3 text-[15px] font-semibold text-muted">{status === "All" && !search ? t.empty : t.emptyFilter}</p>
                {status === "All" && !search && <Link href={`${prefix}/post`} className="btn-primary mt-5 h-11 px-6">{t.post}</Link>}
              </div>
            )}
            {ads?.map((ad) => {
              const live = ad.status === "Active";
              const selected = picked.includes(ad.id);
              return (
                <article key={ad.id} className={`grid gap-4 rounded-2xl border bg-white p-3 shadow-card transition sm:grid-cols-[auto_150px_minmax(0,1fr)_auto] sm:items-center ${selected ? "border-brand-600" : "border-line"}`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => setPicked(selected ? picked.filter((id) => id !== ad.id) : [...picked, ad.id])}
                    aria-label={ad.title}
                    className="hidden h-4 w-4 accent-[var(--color-brand-600)] sm:block"
                  />
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface sm:aspect-[4/3]">
                    {ad.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ad.image.replace(/(\/img\/[^/]+)\.jpg$/i, "$1_m.jpg")} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-line"><Icon name="image" size={30} /></div>
                    )}
                    <span className={`absolute start-2 top-2 rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[ad.status] ?? "bg-surface text-muted"}`}>{t.status[ad.status] ?? ad.status}</span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-ink">{ad.title || ad.category || `#${ad.id}`}</h3>
                    <p className="mt-0.5 truncate text-sm text-muted">{[ad.category, ad.location].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1.5 text-lg font-bold text-brand-700">{ad.price ? `${number(ad.price)} ${t.currency}` : "—"}</p>
                    <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <li className="inline-flex items-center gap-1"><Icon name="search" size={13} />{number(ad.views)} {t.views}</li>
                      <li className="inline-flex items-center gap-1"><Icon name="chat" size={13} />{number(ad.chats)} {t.chats}</li>
                      <li className="inline-flex items-center gap-1"><Icon name="heart" size={13} />{number(ad.favorites)} {t.favorites}</li>
                      {ad.reviews > 0 && ad.rating != null && (
                        <li className="inline-flex items-center gap-1"><Icon name="star" size={13} className="text-star" fill="currentColor" />{Number(ad.rating).toFixed(1)} ({ad.reviews})</li>
                      )}
                      {ad.createdAt && <li>{t.published}: {new Date(ad.createdAt).toLocaleDateString("en-CA")}</li>}
                    </ul>
                    <div className="mt-2 flex items-center gap-2.5 text-xs text-muted">
                      <span className="shrink-0">{t.score}</span>
                      <span className="h-1.5 w-32 overflow-hidden rounded-full bg-surface">
                        <span className={`block h-full rounded-full ${ad.score >= 60 ? "bg-emerald-500" : ad.score >= 25 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${Math.max(4, ad.score)}%` }} />
                      </span>
                      <span className="font-semibold text-ink">{ad.score}</span>
                      {ad.hint && <span className="truncate text-amber-700">{t.hints[ad.hint] ?? ad.hint}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:w-[170px] sm:flex-col">
                    {live && (
                      <>
                        <Link href={`${prefix}/${locale === "en" ? "ad" : "اعلان"}/${ad.id}`} className="btn-outline h-9 flex-1 px-3 text-[13px] sm:flex-none">{t.view}</Link>
                        <button type="button" disabled={busy} onClick={() => act([ad.id], "republish")} className="btn-primary h-9 flex-1 px-3 text-[13px] sm:flex-none">
                          <Icon name="refresh" size={14} />{t.republish}
                        </button>
                      </>
                    )}
                    <div className="flex flex-1 gap-2 sm:flex-none">
                      {ad.status === "Paused" || ad.status === "Expired" || ad.status === "Sold" ? (
                        <button type="button" disabled={busy} onClick={() => act([ad.id], ad.status === "Paused" ? "resume" : "republish")} className="btn-outline h-9 flex-1 px-2 text-[13px]">{t.resume}</button>
                      ) : live ? (
                        <>
                          <button type="button" disabled={busy} onClick={() => act([ad.id], "pause")} className="btn-outline h-9 flex-1 px-2 text-[13px]">{t.pause}</button>
                          <button type="button" disabled={busy} onClick={() => act([ad.id], "sold")} className="btn-outline h-9 flex-1 px-2 text-[13px]">{t.sold}</button>
                        </>
                      ) : null}
                      <button type="button" disabled={busy} onClick={() => act([ad.id], "delete")} aria-label={t.remove} className="btn-outline h-9 px-2.5 text-red-600">
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-5 text-center text-xs text-muted">{t.appOnly}</p>
        </section>
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-6 z-40 mx-auto max-w-md rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-pop">{toast}</div>
      )}
    </div>
  );
}
