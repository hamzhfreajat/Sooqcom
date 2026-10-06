"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type BasicError,
  type BasicInfo,
  type CategoryNode,
  type Lang,
  MIN_PHOTOS,
  RENT_ROOT,
  basicErrors,
  cleanDynamic,
  detailSections,
  formTypeOf,
  missingFields,
  shownName,
} from "@/lib/post/schema";
import { type SessionUser, fetchSession, onSessionChange, requestLogin } from "../AccountButton";
import Icon from "../Icon";
import { AreaStep, CategoryStep, CityStep } from "./ChoiceSteps";
import DetailsStep from "./DetailsStep";
import { BasicStep, PreviewStep } from "./FinalSteps";
import { PhotosStep, VideoStep, uploadFile } from "./MediaSteps";
import { type Area, type Photo, type Place, type WizardState, pick } from "./types";

interface Props {
  lang: Lang;
  categories: CategoryNode[];
  cities: Place[];
  areas: Area[];
  /** Start of an ad's address, e.g. "/اعلان" */
  adPrefix: string;
  /** Lets the steps be walked through without signing in; nothing can be published that way */
  allowPreview?: boolean;
}

const EMPTY: WizardState = {
  photos: [], video: null, path: [], dynamic: {}, payment: "كاش", price: "", down: "", title: "", description: "", phone: "", tags: [], selectedTags: [],
};
const STEPS = 8;
const [PHOTOS, VIDEO, CATEGORY, CITY, AREA, DETAILS, BASIC, PREVIEW] = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 * The add-ad flow, step for step as in the mobile app: photos, video, section,
 * governorate, area, details, basic information, preview and publish.
 */
export default function PostWizard({ lang, categories, cities, areas, adPrefix, allowPreview = false }: Props) {
  const T = pick(lang);
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [previewing, setPreviewing] = useState(false);
  const [state, setState] = useState<WizardState>(EMPTY);
  const [step, setStep] = useState(PHOTOS);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const [rejected, setRejected] = useState<Photo[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfo, BasicError>>>({});
  const [generating, setGenerating] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; tips: string[] } | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [done, setDone] = useState<{ id: number } | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const online = !!user;
  const update = useCallback((changes: Partial<WizardState>) => setState((current) => ({ ...current, ...changes })), []);
  const notice = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    fetchSession().then(setUser);
    return onSessionChange(setUser);
  }, []);
  useEffect(() => {
    if (user?.phone && !stateRef.current.phone) update({ phone: user.phone.replace(/\D/g, "").replace(/^962/, "0").slice(0, 10) });
  }, [user, update]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, done]);

  // ---- what the chosen category means -------------------------------------
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const main = byId.get(state.path[0]);
  const last = byId.get(state.path[state.path.length - 1]);
  const leaf = last && state.path.length > 1 && !categories.some((c) => c.parentId === last.id) ? last : undefined;
  const context = useMemo(() => ({ isRent: main?.id === RENT_ROOT, leafName: leaf?.name ?? "" }), [main, leaf]);
  const sections = useMemo(() => (leaf && main ? detailSections(formTypeOf(leaf, main.name, byId), context) : []), [leaf, main, byId, context]);
  const city = cities.find((c) => c.id === state.cityId);
  const area = areas.find((a) => a.id === state.regionId);

  /** What the server routes need to rebuild the ad. */
  const toInput = (from: WizardState = stateRef.current) => ({
    id: from.adId,
    categoryId: from.path[from.path.length - 1],
    cityId: from.cityId,
    regionId: from.regionId,
    dynamic: from.dynamic,
    payment: from.payment,
    price: from.price,
    down: from.down,
    title: from.title,
    description: from.description,
    phone: from.phone,
    tags: from.selectedTags,
    images: from.photos.map((photo) => photo.url).filter(Boolean),
  });

  /** Keeps a draft of the ad on the server, as the app does. Failing to save never blocks the flow. */
  const saveDraft = async (from?: WizardState) => {
    if (!online) return;
    try {
      const response = await fetch("/api/post/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toInput(from)) });
      const data = await response.json().catch(() => ({}));
      if (response.ok && typeof data.id === "number") update({ adId: data.id });
    } catch {
      /* drafts are best effort */
    }
  };

  /** Uploads the photos that are not on the server yet. Returns the ones that were refused. */
  const uploadPhotos = async (): Promise<Photo[]> => {
    const refused: Photo[] = [];
    const pending = stateRef.current.photos.filter((photo) => photo.status !== "done");
    let index = stateRef.current.photos.length - pending.length;
    for (const photo of pending) {
      index++;
      setBusy(T(`جاري رفع صورة ${index} من ${stateRef.current.photos.length}...`, `Uploading photo ${index} of ${stateRef.current.photos.length}…`));
      const mark = (changes: Partial<Photo>) => setState((current) => ({ ...current, photos: current.photos.map((p) => (p.id === photo.id ? { ...p, ...changes } : p)) }));
      mark({ status: "uploading", error: undefined });
      const result = await uploadFile(photo.file);
      if (result.url) mark({ status: "done", url: result.url });
      else {
        mark({ status: "failed", error: result.error });
        refused.push({ ...photo, status: "failed", error: result.error });
      }
    }
    setBusy("");
    return refused;
  };

  const scrollToField = (key: string) => document.getElementById(`field-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });

  const evaluate = async () => {
    setEvaluation(null);
    if (!online) return;
    setEvaluating(true);
    try {
      const response = await fetch("/api/post/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "evaluate", input: toInput() }) });
      const data = await response.json().catch(() => ({}));
      setEvaluation(response.ok ? { score: data.score, tips: data.tips ?? [] } : { score: 75, tips: [T("تأكد من مراجعة التفاصيل قبل النشر", "Review the details before publishing")] });
    } catch {
      setEvaluation({ score: 75, tips: [T("تأكد من مراجعة التفاصيل قبل النشر", "Review the details before publishing")] });
    }
    setEvaluating(false);
  };

  const generate = async () => {
    if (!online) return notice(T("سجّل الدخول لاستخدام الكتابة بالذكاء الاصطناعي", "Sign in to use the AI writer"));
    setGenerating(true);
    try {
      const response = await fetch("/api/post/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "suggest", input: toInput() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.title) throw new Error("failed");
      update({ title: data.title, description: data.description, tags: data.tags ?? [], selectedTags: data.tags ?? [] });
      setErrors({});
    } catch {
      notice(T("حدث خطأ أثناء التوليد. الرجاء المحاولة مرة أخرى.", "Something went wrong while writing. Please try again."));
    }
    setGenerating(false);
  };

  const publish = async () => {
    if (!online) return notice(T("سجّل الدخول لنشر إعلانك", "Sign in to publish your ad"));
    const refused = await uploadPhotos();
    if (refused.length > 0) {
      setRejected(refused);
      return setStep(PHOTOS);
    }
    if (stateRef.current.photos.filter((photo) => photo.url).length < MIN_PHOTOS) {
      notice(T("لابد من رفع 3 صور على الأقل لنشر الإعلان", "At least 3 photos are needed to publish"));
      return setStep(PHOTOS);
    }
    let videoUrl: string | undefined;
    if (stateRef.current.video) {
      setBusy(T("جاري رفع الفيديو...", "Uploading the video…"));
      const result = await uploadFile(stateRef.current.video.file);
      if (!result.url) {
        setBusy("");
        return notice(result.error ?? T("تعذر رفع الفيديو", "The video could not be uploaded"));
      }
      videoUrl = result.url;
    }
    setBusy(T("جاري نشر الإعلان...", "Publishing your ad…"));
    try {
      const response = await fetch("/api/post/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...toInput(), videoUrl }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.id !== "number") {
        const reason = typeof data.error === "string" && data.error !== "incomplete" && data.error !== "failed" ? data.error : T("تعذّر نشر الإعلان. حاول مرة أخرى.", "The ad could not be published. Please try again.");
        notice(`${T("حدث خطأ", "Error")}: ${reason}`);
      } else setDone({ id: data.id });
    } catch {
      notice(T("تعذّر الاتصال بالخادم. حاول مرة أخرى.", "Could not reach the server. Please try again."));
    }
    setBusy("");
  };

  const next = async () => {
    if (busy) return;
    if (step === PHOTOS) {
      if (state.photos.length < MIN_PHOTOS) return notice(T("الرجاء إضافة 3 صور على الأقل", "Please add at least 3 photos"));
      if (online) {
        const refused = await uploadPhotos();
        if (refused.length > 0) return setRejected(refused);
        if (stateRef.current.photos.filter((photo) => photo.url).length < MIN_PHOTOS) return notice(T("لابد من رفع 3 صور صالحة على الأقل.", "At least 3 valid photos are needed."));
      }
      return setStep(VIDEO);
    }
    if (step === VIDEO) return setStep(CATEGORY);
    if (step === CATEGORY) return leaf ? setStep(CITY) : notice(T("اختر القسم المناسب لإعلانك", "Choose the category for your ad"));
    if (step === CITY) return state.cityId ? setStep(AREA) : notice(T("اختر المحافظة", "Choose the governorate"));
    if (step === AREA) return state.regionId ? setStep(DETAILS) : notice(T("اختر المنطقة", "Choose the area"));
    if (step === DETAILS) {
      const empty = missingFields(sections, state.dynamic, context);
      setMissing(empty);
      if (empty.length > 0) {
        notice(T("الرجاء تعبئة الحقول المطلوبة بشكل صحيح", "Please fill in the required fields"));
        return scrollToField(empty[0]);
      }
      saveDraft();
      return setStep(BASIC);
    }
    if (step === BASIC) {
      const problems = basicErrors(state);
      setErrors(problems);
      const first = (["price", "down", "title", "description", "phone"] as const).find((key) => problems[key]);
      if (first) return scrollToField(first);
      saveDraft();
      setStep(PREVIEW);
      return evaluate();
    }
    if (step === PREVIEW) return publish();
  };

  const pickArea = async (areaId: number) => {
    const picked = { ...stateRef.current, regionId: areaId };
    update({ regionId: areaId });
    if (online) {
      setBusy(T("جاري الحفظ...", "Saving…"));
      await saveDraft(picked);
      setBusy("");
    }
    setStep(DETAILS);
  };

  // ---- gates ---------------------------------------------------------------
  if (user === undefined) {
    return <div className="mx-auto mt-24 h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />;
  }

  if (!user && !previewing) {
    return (
      <Shell lang={lang} title={T("أضف إعلانك", "Post your ad")} subtitle={T("ثماني خطوات قصيرة ويصبح عقارك أمام آلاف الباحثين.", "Eight short steps and your property is in front of thousands of seekers.")}>
        <div className="mx-auto max-w-lg rounded-[24px] border border-line bg-white p-8 text-center shadow-card sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Icon name="user" size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-bold">{T("سجّل الدخول لإضافة إعلانك", "Sign in to post your ad")}</h2>
          <p className="mt-2.5 text-[15px] leading-7 text-muted">
            {T("يحتاج نشر الإعلان إلى حساب حتى تتمكن من إدارته لاحقاً من الموقع أو التطبيق.", "Posting needs an account so you can manage your ad later, here or in the app.")}
          </p>
          <button type="button" onClick={requestLogin} className="btn-primary mt-7 h-[52px] w-full rounded-2xl text-base">
            {T("تسجيل الدخول", "Sign in")}
          </button>
          {allowPreview && (
            <button type="button" onClick={() => setPreviewing(true)} className="mt-4 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
              {T("معاينة الخطوات بدون تسجيل (لا يمكن النشر)", "Preview the steps without signing in (publishing is off)")}
            </button>
          )}
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell lang={lang} title={T("تم رفع الإعلان بنجاح! 🎉", "Your ad is published! 🎉")} subtitle={T("إعلانك الآن ظاهر في التطبيق وعلى الموقع.", "It is now visible in the app and on the website.")}>
        <div className="mx-auto max-w-lg rounded-[24px] border border-line bg-white p-8 text-center shadow-card sm:p-10">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Icon name="check" size={38} />
          </span>
          <h2 className="mt-5 text-2xl font-bold">{state.title}</h2>
          <p className="mt-2 text-[15px] text-muted">
            {shownName(leaf)} · {area?.name}، {city?.name}
          </p>
          <a href={`${adPrefix}/${done.id}`} className="btn-primary mt-7 h-[52px] w-full rounded-2xl text-base">
            {T("عرض الإعلان", "View the ad")}
          </a>
          <button
            type="button"
            onClick={() => {
              setState({ ...EMPTY, phone: state.phone });
              setDone(null);
              setStep(PHOTOS);
            }}
            className="btn-outline mt-3 h-[52px] w-full rounded-2xl text-base"
          >
            {T("إضافة إعلان آخر", "Post another ad")}
          </button>
        </div>
      </Shell>
    );
  }

  // ---- steps ---------------------------------------------------------------
  const names = [T("الصور", "Photos"), T("الريلز", "Video"), T("القسم", "Category"), T("المحافظة", "Governorate"), T("المنطقة", "Area"), T("التفاصيل", "Details"), T("المعلومات", "Basics"), T("المعاينة", "Preview")];
  const heads: [string, string][] = [
    [T("ارفع صور إعلانك بتميز 📸", "Add great photos 📸"), T("الصور الجيدة تزيد من سرعة البيع وتجذب اهتمام المزيد من العملاء المحتملين.", "Good photos sell faster and attract more interest.")],
    [T("ارفع فرص البيع بسرعة 🚀", "Boost your chances 🚀"), T("إعلانات الفيديو (الريلز) تجذب الانتباه أسرع بـ ٤ أضعاف من الصور العادية. أضف مقطعاً قصيراً يستعرض عقارك.", "Video ads catch attention four times faster than photos. Add a short clip showing your property.")],
    [T("ما الذي ترغب بفعله؟ 🤔", "What would you like to do? 🤔"), T("حدد القسم الرئيسي لتخصيص خيارات إعلانك والبدء بخطوات إضافة الإعلان.", "Choose the section so the questions fit your ad.")],
    [T("اختيار المحافظة 📍", "Choose the governorate 📍"), T("حدد المحافظة التي يقع فيها العقار.", "Pick the governorate the property is in.")],
    [T(`اختيار المنطقة - ${city?.name ?? ""}`, `Choose the area - ${city?.name ?? ""}`), T("حدد الحي أو المنطقة ليصل إعلانك إلى الباحثين فيها.", "Pick the neighbourhood so people searching there find your ad.")],
    [T(`أخبرنا المزيد عن ${leaf?.name ?? ""}`, `Tell us more about: ${shownName(leaf)}`), T("التفاصيل الدقيقة تزيد من فرصتك في البيع أو التأجير بنسبة 70% 🚀", "Exact details raise your chances of selling or renting by 70% 🚀")],
    [T("المعلومات الأساسية ✍️", "Basic information ✍️"), T("السعر والعنوان والوصف ورقم التواصل. يمكنك ترك الكتابة للذكاء الاصطناعي.", "Price, title, description and contact number. You can let the AI do the writing.")],
    [T("معاينة الإعلان 👁️", "Preview your ad 👁️"), T("راجع إعلانك كما سيراه الآخرون، ثم انشره.", "Check your ad as others will see it, then publish.")],
  ];
  const stepProps = { lang, state, update, categories, cities, areas, online };
  const nextLabel =
    step === VIDEO
      ? state.video ? T("متابعة", "Continue") : T("تخطي الخطوة", "Skip this step")
      : step === DETAILS
        ? T("متابعة للمعلومات الأساسية 👉", "Continue to basic information 👉")
        : step === BASIC
          ? T("متابعة للمعاينة 👁️", "Continue to preview 👁️")
          : step === PREVIEW
            ? T("انشر الإعلان الآن", "Publish the ad now")
            : T("متابعة", "Continue");
  // The pick-one steps move on by themselves; their button only appears once something is chosen
  const showNext = !(step === CATEGORY && !leaf) && !(step === CITY && !state.cityId) && !(step === AREA && !state.regionId);

  const actions = (
    <>
      {step > PHOTOS && (
        <button type="button" onClick={() => setStep(step - 1)} disabled={!!busy} className="btn-outline h-[52px] shrink-0 rounded-2xl px-5 text-[15px] sm:px-7 lg:h-11 lg:rounded-xl lg:px-5 lg:text-sm">
          <Icon name="chevron" size={16} className="ltr:rotate-180" />
          {step === PREVIEW ? T("تعديل", "Edit") : T("السابق", "Back")}
        </button>
      )}
      <p className="hidden flex-1 text-sm text-muted lg:block">
        {T("الخطوة", "Step")} {step + 1} {T("من", "of")} {STEPS}
      </p>
      {busy ? (
        <p className="flex h-[52px] flex-1 items-center justify-center gap-3 rounded-2xl bg-brand-50 px-6 text-[15px] font-bold text-brand-700 lg:h-11 lg:flex-none lg:rounded-xl lg:text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          {busy}
        </p>
      ) : showNext ? (
        <button
          type="button"
          onClick={next}
          className={`h-[52px] flex-1 rounded-2xl px-8 text-base font-bold transition lg:h-11 lg:min-w-[220px] lg:flex-none lg:rounded-xl lg:text-[15px] ${
            step === PHOTOS && state.photos.length < MIN_PHOTOS ? "bg-line text-muted" : "bg-brand-600 text-white shadow-[0_6px_16px_rgb(21_87_245/0.25)] hover:bg-brand-700"
          }`}
        >
          {step === PHOTOS && state.photos.length < MIN_PHOTOS ? T("الرجاء إضافة 3 صور على الأقل", "Please add at least 3 photos") : nextLabel}
        </button>
      ) : (
        <p className="flex-1 text-center text-sm text-muted lg:flex-none">{T("اختر من القائمة للمتابعة", "Choose from the list to continue")}</p>
      )}
    </>
  );

  // Wide screens: the steps as a list at the side, with a running summary of the ad under it
  const cover = state.photos[0];
  const summary: [string, string][] = [
    [T("القسم", "Category"), shownName(leaf)],
    [T("الموقع", "Location"), [area?.name, city?.name].filter(Boolean).join(lang === "ar" ? "، " : ", ")],
    [context.isRent ? T("الإيجار", "Rent") : T("السعر", "Price"), state.payment === "أقساط" ? T("أقساط", "Instalments") : state.price ? `${Number(state.price).toLocaleString("en-US")} ${T("د.أ", "JOD")}` : ""],
    [T("الصور", "Photos"), state.photos.length ? String(state.photos.length) : ""],
    [T("الفيديو", "Video"), state.video ? T("مرفق", "Attached") : ""],
  ];
  const aside = (
    <>
      <nav className="rounded-2xl border border-line bg-white p-2.5 shadow-card" aria-label={T("خطوات إضافة الإعلان", "Steps")}>
        <ol>
          {names.map((name, index) => {
            const state_ = index < step ? "done" : index === step ? "current" : "todo";
            return (
              <li key={name} aria-current={index === step ? "step" : undefined}>
                <button
                  type="button"
                  disabled={index >= step || !!busy}
                  onClick={() => setStep(index)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition disabled:cursor-default ${
                    state_ === "current" ? "bg-brand-50" : state_ === "done" ? "hover:bg-surface" : ""
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      state_ === "done" ? "bg-emerald-500 text-white" : state_ === "current" ? "bg-brand-600 text-white" : "bg-surface text-muted"
                    }`}
                  >
                    {state_ === "done" ? <Icon name="check" size={15} /> : index + 1}
                  </span>
                  <span className={`text-sm ${state_ === "current" ? "font-bold text-brand-700" : state_ === "done" ? "font-semibold text-ink" : "text-muted"}`}>{name}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.preview} alt="" className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center bg-surface text-line">
            <Icon name="image" size={32} />
          </div>
        )}
        <div className="p-4">
          <h2 className="text-sm font-bold text-ink">{T("ملخص إعلانك", "Your ad so far")}</h2>
          <dl className="mt-2">
            {summary.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3 border-b border-line py-2 text-sm last:border-b-0">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className={`text-end ${value ? "font-semibold text-ink" : "text-line"}`}>{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );

  return (
    <Shell
      lang={lang}
      title={heads[step][0]}
      subtitle={heads[step][1]}
      aside={aside}
      actions={actions}
      progress={
        <ol className="mt-7 grid grid-cols-8 gap-1.5 sm:gap-2.5" aria-label={T("خطوات إضافة الإعلان", "Steps")}>
          {names.map((name, index) => (
            <li key={name} aria-current={index === step ? "step" : undefined}>
              <button
                type="button"
                disabled={index >= step || !!busy}
                onClick={() => setStep(index)}
                className="group block w-full text-start disabled:cursor-default"
                aria-label={`${index + 1}. ${name}`}
              >
                <span className={`block h-1.5 rounded-full transition ${index < step ? "bg-brand-600 group-hover:bg-brand-700" : index === step ? "bg-brand-600" : "bg-white/80"}`} />
                <span className={`mt-2 hidden truncate text-xs lg:block ${index === step ? "font-bold text-brand-700" : index < step ? "font-semibold text-ink" : "text-muted"}`}>
                  {index + 1}. {name}
                </span>
              </button>
            </li>
          ))}
        </ol>
      }
      chip={`${T("الخطوة", "Step")} ${step + 1} ${T("من", "of")} ${STEPS} · ${names[step]}`}
    >
      {!online && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-[13px] font-medium text-amber-900">
          <Icon name="alert" size={15} className="shrink-0" />
          <span className="flex-1">{T("أنت في وضع المعاينة: لا تُرفع الصور ولا يمكن النشر قبل تسجيل الدخول.", "Preview mode: photos are not uploaded and nothing can be published until you sign in.")}</span>
          <button type="button" onClick={requestLogin} className="shrink-0 font-bold text-brand-700 hover:underline">{T("تسجيل الدخول", "Sign in")}</button>
        </p>
      )}

      {step === PHOTOS && <PhotosStep {...stepProps} notice={notice} />}
      {step === VIDEO && <VideoStep {...stepProps} notice={notice} />}
      {step === CATEGORY && <CategoryStep {...stepProps} onDone={() => setStep(CITY)} />}
      {step === CITY && <CityStep {...stepProps} onDone={() => setStep(AREA)} />}
      {step === AREA && <AreaStep {...stepProps} onPick={pickArea} busy={!!busy} />}
      {step === DETAILS && (
        <DetailsStep
          lang={lang}
          sections={sections}
          context={context}
          data={state.dynamic}
          missing={missing}
          onChange={(key, value) => {
            const dynamic = { ...stateRef.current.dynamic, [key]: value };
            stateRef.current = { ...stateRef.current, dynamic };
            update({ dynamic });
            if (missing.length) setMissing(missingFields(sections, dynamic, context).filter((field) => missing.includes(field)));
          }}
        />
      )}
      {step === BASIC && (
        <BasicStep
          lang={lang}
          state={state}
          update={(changes) => {
            update(changes);
            if (Object.keys(errors).length) setErrors(basicErrors({ ...state, ...changes } as BasicInfo));
          }}
          isRent={context.isRent}
          leafName={shownName(leaf)}
          errors={errors}
          generating={generating}
          onGenerate={generate}
        />
      )}
      {step === PREVIEW && (
        <PreviewStep
          lang={lang}
          state={state}
          sections={sections}
          context={context}
          dynamic={cleanDynamic(sections, state.dynamic, context)}
          names={{ category: shownName(leaf), city: city?.name ?? "", region: area?.name ?? "" }}
          evaluation={evaluation}
          evaluating={evaluating}
        />
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center gap-2.5 rounded-2xl bg-ink px-4 py-3.5 text-sm font-semibold text-white shadow-pop">
          <Icon name="alert" size={18} className="shrink-0 text-amber-300" />
          {toast}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[24px] bg-white p-6 shadow-pop">
            <h2 className="text-lg font-bold text-red-600">{T("عذراً، تم رفض بعض الصور", "Sorry, some photos were refused")}</h2>
            <ul className="mt-4 space-y-3">
              {rejected.map((photo) => (
                <li key={photo.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">
                      {T("صورة", "Photo")} {state.photos.findIndex((p) => p.id === photo.id) + 1}
                    </span>
                    <span className="block text-xs leading-5 text-red-600">{photo.error}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const ids = new Set(rejected.map((photo) => photo.id));
                  update({ photos: state.photos.filter((photo) => !ids.has(photo.id)) });
                  setRejected([]);
                }}
                className="btn-primary h-12 flex-1 rounded-2xl"
              >
                {T("حذف الصور المرفوضة", "Remove the refused photos")}
              </button>
              <button type="button" onClick={() => setRejected([])} className="btn-outline h-12 rounded-2xl px-5">
                {T("إلغاء", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

/**
 * The page frame.
 *   Phones: a sky-blue band with the step's title, the content, and the buttons fixed at the bottom.
 *   Wide screens: the steps and a summary in a side column, the step in a wide panel beside it,
 *   and the buttons in a bar that stays at the foot of that panel.
 */
function Shell({
  lang,
  title,
  subtitle,
  chip,
  progress,
  aside,
  actions,
  children,
}: {
  lang: Lang;
  title: string;
  subtitle: string;
  chip?: string;
  progress?: React.ReactNode;
  aside?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const band = "bg-[linear-gradient(to_bottom,#ffffff_0%,#cfe3fd_30%,#b3d2fb_62%,var(--color-surface)_100%)]";
  const heading = (
    <>
      {chip && <p className="inline-flex items-center rounded-full border border-white bg-white/75 px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-card">{chip}</p>}
      <h1 className="mt-4 text-[28px] font-bold leading-tight text-ink sm:text-[34px]">{title}</h1>
      <p className="mt-3 max-w-3xl text-[15px] font-medium leading-7 text-ink/75 sm:text-base">{subtitle}</p>
    </>
  );

  // Sign-in and success screens: one centred column on every screen
  if (!aside) {
    return (
      <div className="min-h-[80vh] bg-surface" dir={lang === "ar" ? "rtl" : "ltr"}>
        <header className={band}>
          <div className="mx-auto w-full max-w-[1100px] px-4 pb-10 pt-9 text-center sm:px-6 sm:pt-12">{heading}</div>
        </header>
        <div className="mx-auto w-full max-w-[1100px] px-4 pb-20 sm:px-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-surface" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className={`${band} lg:hidden`}>
        <div className="px-4 pb-9 pt-8 sm:px-6">
          {heading}
          {progress}
        </div>
      </header>

      <div className="container-page pb-32 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6 lg:pb-8 lg:pt-5">
        <aside className="sticky top-[92px] hidden lg:block">{aside}</aside>

        <div className="min-w-0">
          <header className="mb-4 hidden items-center gap-4 border-b border-line pb-4 lg:flex">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[22px] font-bold leading-tight text-ink">{title}</h1>
              <p className="mt-1 truncate text-sm text-muted">{subtitle}</p>
            </div>
            {chip && <p className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{chip}</p>}
          </header>
          {children}

          {/* The buttons: fixed to the bottom of the screen on phones, a bar at the foot of the panel on wide screens */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:sticky lg:inset-x-auto lg:bottom-3 lg:mt-5 lg:rounded-2xl lg:border lg:shadow-lift">
            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-4 lg:py-2.5">{actions}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
