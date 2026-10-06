"use client";

import { useRef, useState } from "react";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, MIN_PHOTOS } from "@/lib/post/schema";
import Icon from "../Icon";
import { type Photo, type StepProps, type Video, pick } from "./types";

let nextPhotoId = 0;

/** Sends one file to the server and returns its stored address, or the reason it was refused. */
export async function uploadFile(file: File): Promise<{ url?: string; error?: string }> {
  const body = new FormData();
  body.append("file", file, file.name);
  try {
    const response = await fetch("/api/post/upload", { method: "POST", body });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) return { error: typeof data.error === "string" ? data.error : `تعذر الرفع (خطأ ${response.status})` };
    return { url: data.url };
  } catch {
    return { error: "تعذر الاتصال بالخادم" };
  }
}

/** Step 1: the photos. At least three; the first one is the cover. */
export function PhotosStep({ lang, state, update, notice }: StepProps & { notice: (message: string) => void }) {
  const T = pick(lang);
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { photos } = state;

  const add = (files: FileList | File[] | null) => {
    if (!files) return;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const fitting = images.filter((file) => file.size <= MAX_PHOTO_BYTES);
    if (fitting.length < images.length) notice(T("تم استبعاد بعض الصور لأن حجمها يتجاوز 5 ميجابايت.", "Some photos were left out because they are larger than 5 MB."));
    const added: Photo[] = fitting.map((file) => ({ id: `p${nextPhotoId++}`, file, preview: URL.createObjectURL(file), status: "idle" }));
    const all = [...photos, ...added];
    for (const extra of all.slice(MAX_PHOTOS)) URL.revokeObjectURL(extra.preview);
    update({ photos: all.slice(0, MAX_PHOTOS) });
  };

  const remove = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.preview);
    update({ photos: photos.filter((p) => p.id !== id) });
  };
  const makeCover = (id: string) => update({ photos: [...photos.filter((p) => p.id === id), ...photos.filter((p) => p.id !== id)] });

  const cover = photos[0];
  const rest = photos.slice(1);
  const missing = Math.max(0, MIN_PHOTOS - photos.length);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-[13px] font-medium leading-6 text-rose-700">
        <Icon name="shield" size={15} className="mt-1 shrink-0" />
        {T(
          "لضمان قبول إعلانك فوراً، يرجى التأكد من رفع صور خالية من شعارات التطبيقات الأخرى أو النصوص الإضافية.",
          "To have your ad accepted straight away, upload photos without other apps' logos or added text.",
        )}
      </div>

      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(event) => { add(event.target.files); event.target.value = ""; }} />

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); add(event.dataTransfer.files); }}
          className={`flex h-[240px] w-full flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed transition ${
            dragging ? "border-brand-600 bg-brand-100" : "border-brand-200 bg-brand-50/60 hover:border-brand-500 hover:bg-brand-50"
          }`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <Icon name="image" size={26} />
          </span>
          <span className="text-base font-bold text-brand-700">{T("إضافة صور", "Add photos")}</span>
          <span className="text-sm text-muted">{T("اسحب الصور إلى هنا أو اضغط للاختيار", "Drag photos here or click to choose")}</span>
        </button>
      ) : (
        <div
          className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); add(event.dataTransfer.files); }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">{T("الصورة الرئيسية (الغلاف)", "Main photo (cover)")}</p>
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-muted" dir="ltr">
                {photos.length} / {MAX_PHOTOS}
              </p>
              {photos.length < MAX_PHOTOS && (
                <button type="button" onClick={() => input.current?.click()} className="btn-primary h-10 px-4 text-sm">
                  <Icon name="plus" size={16} />
                  {T("إضافة صور", "Add photos")}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <PhotoTile photo={cover} cover onRemove={() => remove(cover.id)} lang={lang} large />
            <div className="grid grid-cols-3 content-start gap-2.5 xl:grid-cols-5">
              {rest.map((photo) => (
                <PhotoTile key={photo.id} photo={photo} onRemove={() => remove(photo.id)} onCover={() => makeCover(photo.id)} lang={lang} />
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/60 text-brand-700 transition hover:border-brand-500"
                >
                  <Icon name="plus" size={24} />
                  <span className="px-1 text-center text-xs font-bold">{T("إضافة صور جديدة", "Add more")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <button type="button" onClick={() => input.current?.click()} className="btn-primary h-14 w-full rounded-2xl text-base lg:hidden">
          <Icon name="image" size={20} />
          {T("إضافة صور", "Add photos")}
        </button>
      )}

      <p className={`text-center text-[13px] font-semibold ${missing ? "text-muted" : "text-emerald-700"}`}>
        {missing
          ? T(`الرجاء إضافة ${MIN_PHOTOS} صور على الأقل (باقي ${missing})`, `Please add at least ${MIN_PHOTOS} photos (${missing} to go)`)
          : T("ممتاز! الصور الواضحة تجذب مهتمين أكثر.", "Great! Clear photos attract more interest.")}
      </p>
    </div>
  );
}

function PhotoTile({
  photo,
  cover = false,
  large = false,
  onRemove,
  onCover,
  lang,
}: {
  photo: Photo;
  cover?: boolean;
  large?: boolean;
  onRemove: () => void;
  onCover?: () => void;
  lang: "ar" | "en";
}) {
  const T = pick(lang);
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-surface ${large ? "aspect-[4/3] sm:aspect-auto sm:min-h-[240px]" : "aspect-square"} ${photo.status === "failed" ? "ring-2 ring-red-400" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.preview} alt="" className="h-full w-full object-cover" />
      {cover && (
        <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
          <Icon name="star" size={12} fill="currentColor" />
          {T("الغلاف", "Cover")}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={T("حذف الصورة", "Remove photo")}
        className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/65 text-white transition hover:bg-red-600"
      >
        <Icon name="close" size={15} />
      </button>
      {onCover && (
        <button
          type="button"
          onClick={onCover}
          className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-ink/70 py-1.5 text-[11px] font-bold text-white opacity-0 transition hover:bg-brand-600 focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
        >
          {T("تعيين كرئيسية", "Make cover")}
        </button>
      )}
      {photo.status === "uploading" && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/60">
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </span>
      )}
      {photo.status === "done" && (
        <span className={`absolute ${cover ? "bottom-2.5 start-2.5" : "start-2 top-2"} flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white`}>
          <Icon name="check" size={14} />
        </span>
      )}
    </div>
  );
}

/** Reads a video's length in seconds without uploading it. */
function videoSeconds(url: string): Promise<number> {
  return new Promise((resolve) => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => resolve(Number.isFinite(probe.duration) ? probe.duration : 0);
    probe.onerror = () => resolve(0);
    probe.src = url;
  });
}

/** Step 2: an optional short video ("reel"). */
export function VideoStep({ lang, state, update, notice }: StepProps & { notice: (message: string) => void }) {
  const T = pick(lang);
  const input = useRef<HTMLInputElement>(null);
  const { video } = state;

  const choose = async (file?: File) => {
    if (!file || !file.type.startsWith("video/")) return;
    if (file.size > MAX_VIDEO_BYTES) return notice(T("حجم الفيديو كبير جداً", "The video file is too large"));
    const preview = URL.createObjectURL(file);
    const seconds = await videoSeconds(preview);
    if (seconds > MAX_VIDEO_SECONDS + 0.5) {
      URL.revokeObjectURL(preview);
      return notice(T("يجب أن لا تتجاوز مدة الفيديو 30 ثانية", "The video must not be longer than 30 seconds"));
    }
    if (video) URL.revokeObjectURL(video.preview);
    const next: Video = { file, preview, seconds };
    update({ video: next });
  };

  const tips = [
    T("يمكنك إضافة فيديو لمدة لا تتجاوز 30 ثانية", "You can add a video of up to 30 seconds"),
    T("اشرح مميزات العقار بشكل سريع وواضح وصوتي إن أمكن", "Show the property's strengths quickly and clearly, with your voice if you can"),
    T("لأفضل تجربة، احرص على التصوير بشكل عمودي (طولي)", "For the best result, film upright (portrait)"),
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <ul className="space-y-3">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm leading-7 text-body">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Icon name="check" size={14} />
              </span>
              {tip}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl bg-surface px-3.5 py-2.5 text-[13px] leading-6 text-muted">
          {T("هذه الخطوة اختيارية. يمكنك تخطيها ونشر إعلانك بالصور فقط.", "This step is optional. You can skip it and publish with photos only.")}
        </p>
      </div>

      <div>
        <input ref={input} type="file" accept="video/mp4,video/quicktime,video/*" hidden onChange={(event) => { choose(event.target.files?.[0]); event.target.value = ""; }} />
        {video ? (
          <div className="overflow-hidden rounded-[24px] border border-line bg-ink shadow-card">
            <div className="relative">
              <video src={video.preview} controls playsInline className="mx-auto max-h-[440px] w-full bg-black object-contain" />
              <span className="pointer-events-none absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                <Icon name="check" size={13} />
                {T("جاهز للعرض", "Ready")}
              </span>
            </div>
            <div className="flex gap-2 bg-white p-3">
              <button type="button" onClick={() => input.current?.click()} className="btn-outline h-11 flex-1">
                <Icon name="refresh" size={17} />
                {T("تغيير الفيديو", "Change video")}
              </button>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(video.preview);
                  update({ video: null });
                }}
                className="btn-outline h-11 px-4 text-red-600"
                aria-label={T("حذف الفيديو", "Remove video")}
              >
                <Icon name="trash" size={17} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex h-[260px] w-full flex-col items-center justify-center gap-2.5 rounded-[20px] border-2 border-dashed border-brand-200 bg-brand-50/60 px-6 text-center transition hover:border-brand-500 hover:bg-brand-50"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <Icon name="video" size={26} />
            </span>
            <span className="text-base font-bold text-brand-700">{T("اضغط لاختيار فيديو", "Click to choose a video")}</span>
            <span className="text-sm text-muted">{T("أو يمكنك تخطي هذه الخطوة", "Or you can skip this step")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
