"use client";

import { useCallback, useEffect, useState } from "react";
import { type SessionUser, fetchSession, onSessionChange, requestLogin } from "./AccountButton";
import Icon from "./Icon";

interface Review {
  id: number;
  rating: number;
  tags: string[];
  comment: string | null;
  created_at: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
}

interface Summary {
  average_rating: number;
  reviews_count: number;
  rating_breakdown: Record<string, number>;
  reviews: Review[];
  my_review: Review | null;
  available_tags: { negative: string[]; positive: string[] };
}

const FIRST = 3;
const PAGE = 20;

const TEXT = {
  ar: {
    title: "تقييمات الإعلان", none: "لا توجد تقييمات بعد. كن أول من يقيّم هذا الإعلان.", count: (n: number) => `${n} تقييم`, more: "عرض المزيد", add: "أضف تقييمك",
    edit: "تعديل تقييمك", yours: "تقييمك", stars: "تقييمك بالنجوم", tags: "ما الذي ينطبق على هذا الإعلان؟", comment: "تعليق (اختياري)", hint: "اكتب تجربتك مع هذا الإعلان...",
    send: "إرسال التقييم", cancel: "إلغاء", remove: "حذف تقييمي", login: "سجّل الدخول لتقييم الإعلان", failed: "تعذّر حفظ التقييم. حاول مرة أخرى.", anonymous: "مستخدم سوقكم",
    pick: "اختر عدد النجوم أولاً",
  },
  en: {
    title: "Reviews", none: "No reviews yet. Be the first to review this listing.", count: (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`, more: "Show more", add: "Add your review",
    edit: "Edit your review", yours: "Your review", stars: "Your rating", tags: "What applies to this listing?", comment: "Comment (optional)", hint: "Describe your experience with this listing…",
    send: "Submit review", cancel: "Cancel", remove: "Delete my review", login: "Sign in to review this listing", failed: "The review could not be saved. Please try again.", anonymous: "Sooqcom user",
    pick: "Choose a star rating first",
  },
};

function Stars({ value, size = 16, onPick }: { value: number; size?: number; onPick?: (value: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) =>
        onPick ? (
          <button key={star} type="button" onClick={() => onPick(star)} aria-label={`${star}`} aria-pressed={value === star} className="p-0.5 transition hover:scale-110">
            <Icon name="star" size={size} className={star <= value ? "text-star" : "text-line"} fill="currentColor" />
          </button>
        ) : (
          <Icon key={star} name="star" size={size} className={star <= Math.round(value) ? "text-star" : "text-line"} fill="currentColor" />
        ),
      )}
    </span>
  );
}

/** An ad's reviews: the average, the breakdown, the latest reviews, and a form for the visitor's own. */
export default function ReviewsSection({ adId, locale }: { adId: number; locale: "ar" | "en" }) {
  const t = TEXT[locale];
  const [data, setData] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [shown, setShown] = useState(FIRST);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [form, setForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/reviews/${adId}?limit=${PAGE}`, { cache: "no-store" });
      if (!response.ok) return;
      const summary = (await response.json()) as Summary;
      setData(summary);
      setReviews(summary.reviews);
    } catch {
      /* the section simply stays hidden */
    }
  }, [adId]);

  useEffect(() => {
    load();
    fetchSession().then(setUser);
    // Signing in may reveal the visitor's own review
    return onSessionChange((next) => {
      setUser(next);
      load();
    });
  }, [load]);

  if (!data) return null;

  const openForm = () => {
    if (!user) return requestLogin();
    setRating(data.my_review?.rating ?? 0);
    setTags(data.my_review?.tags ?? []);
    setComment(data.my_review?.comment ?? "");
    setError("");
    setForm(true);
  };

  const showMore = async () => {
    if (shown < reviews.length || reviews.length >= data.reviews_count) return setShown(shown + PAGE);
    const response = await fetch(`/api/reviews/${adId}?skip=${reviews.length}&limit=${PAGE}`, { cache: "no-store" });
    if (response.ok) setReviews([...reviews, ...((await response.json()) as Summary).reviews]);
    setShown(shown + PAGE);
  };

  const submit = async () => {
    if (!rating) return setError(t.pick);
    setBusy(true);
    setError("");
    const response = await fetch(`/api/reviews/${adId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, tags, comment }) });
    setBusy(false);
    if (!response.ok) return setError(t.failed);
    setForm(false);
    setShown(FIRST);
    load();
  };

  const remove = async () => {
    setBusy(true);
    await fetch(`/api/reviews/${adId}`, { method: "DELETE" });
    setBusy(false);
    setForm(false);
    load();
  };

  // Low ratings offer the "what is wrong" tags, high ones the "what is right" tags, as in the app
  const offered = rating === 0 ? [] : rating <= 2 ? data.available_tags.negative : rating >= 4 ? data.available_tags.positive : [...data.available_tags.positive, ...data.available_tags.negative];
  const total = data.reviews_count;
  const visible = reviews.slice(0, shown);

  return (
    <section className="card mt-6 p-5 sm:p-6" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews-title" className="text-lg font-bold text-ink">{t.title}</h2>
        <button type="button" onClick={openForm} className="btn-outline h-10 px-4">
          <Icon name="star" size={16} />
          {data.my_review ? t.edit : t.add}
        </button>
      </div>

      {total > 0 ? (
        <div className="mt-5 grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <div className="text-center sm:px-4">
            <p className="text-5xl font-bold leading-none text-ink">{data.average_rating.toFixed(1)}</p>
            <div className="mt-2"><Stars value={data.average_rating} size={18} /></div>
            <p className="mt-1.5 text-sm text-muted">{t.count(total)}</p>
          </div>
          <ul className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.rating_breakdown[String(star)] ?? 0;
              return (
                <li key={star} className="flex items-center gap-2.5 text-xs text-muted">
                  <span className="w-3 text-center font-semibold text-ink">{star}</span>
                  <Icon name="star" size={12} className="text-star" fill="currentColor" />
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                    <span className="block h-full rounded-full bg-star" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                  </span>
                  <span className="w-6 text-end">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-surface px-4 py-5 text-center text-sm text-muted">{t.none}</p>
      )}

      {form && (
        <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 sm:p-5">
          <p className="text-sm font-bold text-ink">{t.stars}</p>
          <div className="mt-2"><Stars value={rating} size={30} onPick={(value) => { setRating(value); setTags([]); }} /></div>
          {offered.length > 0 && (
            <>
              <p className="mt-4 text-sm font-bold text-ink">{t.tags}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {offered.map((tag) => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setTags(selected ? tags.filter((item) => item !== tag) : [...tags, tag])}
                      className={`h-9 rounded-full border px-3.5 text-sm transition ${selected ? "border-brand-600 bg-brand-600 font-semibold text-white" : "border-line bg-white text-body hover:border-brand-500"}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <label className="mt-4 block text-sm font-bold text-ink">
            {t.comment}
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value.slice(0, 500))}
              rows={3}
              dir="auto"
              placeholder={t.hint}
              className="mt-2 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] font-normal leading-7 text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
          {error && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={submit} disabled={busy} className="btn-primary h-11 px-6">{t.send}</button>
            <button type="button" onClick={() => setForm(false)} className="btn-outline h-11 px-5">{t.cancel}</button>
            {data.my_review && (
              <button type="button" onClick={remove} disabled={busy} className="ms-auto text-sm font-semibold text-red-600 hover:underline">{t.remove}</button>
            )}
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {visible.map((review) => (
            <li key={review.id} className="py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700">
                  {review.reviewer_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.reviewer_avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="user" size={18} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {review.reviewer_name || t.anonymous}
                    {data.my_review?.id === review.id && <span className="ms-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">{t.yours}</span>}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <Stars value={review.rating} size={13} />
                    {new Date(review.created_at).toLocaleDateString(locale === "ar" ? "ar-JO-u-nu-latn" : "en-GB", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              {review.tags.length > 0 && (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {review.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-body">{tag}</li>
                  ))}
                </ul>
              )}
              {review.comment && <p className="mt-2 text-sm leading-7 text-body" dir="auto">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {(shown < reviews.length || reviews.length < total) && (
        <button type="button" onClick={showMore} className="btn-outline mt-2 h-10 w-full">{t.more}</button>
      )}
    </section>
  );
}
