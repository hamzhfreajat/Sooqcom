"use client";

import {
  type BasicError,
  type BasicInfo,
  type DynamicData,
  type FormContext,
  type Lang,
  DESCRIPTION_MIN,
  PAYMENT_METHODS,
  PHONE_PATTERN,
  type Section,
  TITLE_MAX,
  TITLE_MIN,
  amount,
  isShown,
  optionLabel,
  westernDigits,
} from "@/lib/post/schema";
import type { AdCard } from "@/lib/types";
import AdRowCard from "../AdRowCard";
import Icon from "../Icon";
import { FieldError, FormCard, FormRow, RadioChips, TextBox } from "./fields";
import { type WizardState, pick } from "./types";

const ERROR_TEXT: Record<BasicError, [string, string]> = {
  price: ["مطلوب إدخال السعر", "Please enter the price"],
  down: ["مطلوب إدخال الدفعة الأولى", "Please enter the down payment"],
  titleShort: ["أدخل عنواناً لا يقل عن 10 أحرف", "Enter a title of at least 10 characters"],
  titleLong: ["العنوان طويل جداً (الحد الأقصى 70 حرف)", "The title is too long (70 characters at most)"],
  description: ["أدخل تفاصيل لا تقل عن 20 حرفاً", "Enter a description of at least 20 characters"],
  phoneMissing: ["مطلوب إدخال رقم الموبايل", "Please enter the mobile number"],
  phoneInvalid: ["يجب أن يكون رقماً أردنياً صحيحاً (مثال: 0791234567)", "It must be a valid Jordanian number (e.g. 0791234567)"],
};

interface BasicProps {
  lang: Lang;
  state: WizardState;
  update: (changes: Partial<WizardState>) => void;
  isRent: boolean;
  leafName: string;
  errors: Partial<Record<keyof BasicInfo, BasicError>>;
  generating: boolean;
  onGenerate: () => void;
}

/** Step 7: price, title, description and phone, with the AI writer. */
export function BasicStep({ lang, state, update, isRent, leafName, errors, generating, onGenerate }: BasicProps) {
  const T = pick(lang);
  const message = (key: keyof BasicInfo) => (errors[key] ? T(...ERROR_TEXT[errors[key] as BasicError]) : undefined);
  const showPrice = state.payment !== "أقساط";
  const showDown = state.payment === "أقساط" || state.payment === "كاش أو أقساط";
  const spoken = (value: string) => {
    const number = amount(value);
    return number ? `${number.toLocaleString("en-US")} ${T("دينار أردني", "Jordanian dinars")}` : "";
  };

  const titleLength = state.title.trim().length;
  const titleOk = titleLength >= TITLE_MIN && titleLength <= TITLE_MAX;
  const descriptionLength = state.description.trim().length;
  const descriptionOk = descriptionLength >= DESCRIPTION_MIN;
  const phoneOk = PHONE_PATTERN.test(state.phone);
  const priceOk = (!showPrice || !!amount(state.price)) && (!showDown || !!amount(state.down));
  // How ready the step is, shown in each block's header
  const badge = (ok: boolean) => (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-white text-muted shadow-card"}`}>
      {ok && <Icon name="check" size={13} />}
      {ok ? T("مكتمل", "Complete") : T("مطلوب", "Required")}
    </span>
  );
  const meter = (length: number, min: number, max: number) => {
    const share = Math.min(100, (length / (max || min * 4)) * 100);
    const tone = length === 0 ? "bg-line" : length < min ? "bg-amber-400" : "bg-emerald-500";
    return (
      <span className="block h-1 flex-1 overflow-hidden rounded-full bg-line">
        <span className={`block h-full rounded-full transition-all ${tone}`} style={{ width: `${share}%` }} />
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <FormCard title={isRent ? T("قيمة الإيجار", "Rent") : T("السعر وطريقة الدفع", "Price and payment")} icon="chart" flush aside={badge(priceOk)}>
        {!isRent && (
          <FormRow label={T("طريقة الدفع", "Payment method")} note={T("كيف تريد استلام الثمن؟", "How would you like to be paid?")} required answered>
            <RadioChips options={PAYMENT_METHODS} value={state.payment} onChange={(value) => update({ payment: value || state.payment })} lang={lang} />
          </FormRow>
        )}
        {showPrice && (
          <FormRow
            id="field-price"
            label={isRent ? T("الإيجار المطلوب", "Asking rent") : T("السعر", "Price")}
            note={isRent ? T("اكتب المبلغ كما ستطلبه: شهرياً أو سنوياً.", "Enter the amount as you will ask for it: per month or per year.") : T("السعر الإجمالي للعقار.", "The total price of the property.")}
            required
            answered={!!amount(state.price)}
            invalid={!!errors.price}
          >
            <div className="max-w-[300px]">
              <TextBox value={state.price} onChange={(price) => update({ price })} unit={T("دينار", "JOD")} numeric placeholder="0" invalid={!!errors.price} />
            </div>
            {spoken(state.price) && <p className="mt-2 text-[13px] font-semibold text-brand-700">{spoken(state.price)}</p>}
            <FieldError message={message("price")} />
          </FormRow>
        )}
        {showDown && (
          <FormRow
            id="field-down"
            label={T("دفعة أولى", "Down payment")}
            note={T("المبلغ المطلوب مقدماً قبل الأقساط.", "The amount due up front, before the instalments.")}
            required
            answered={!!amount(state.down)}
            invalid={!!errors.down}
          >
            <div className="max-w-[300px]">
              <TextBox value={state.down} onChange={(down) => update({ down })} unit={T("دينار", "JOD")} numeric placeholder="0" invalid={!!errors.down} />
            </div>
            {spoken(state.down) && <p className="mt-2 text-[13px] font-semibold text-brand-700">{spoken(state.down)}</p>}
            <FieldError message={message("down")} />
          </FormRow>
        )}
      </FormCard>

      <FormCard title={T("نص الإعلان", "Ad text")} icon="sparkle" flush aside={badge(titleOk && descriptionOk)}>
        {/* The AI writer: one line that says what it does, and its button */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line bg-gradient-to-l from-[#fdf2f8] via-[#fff7ed] to-white px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8A2387] via-[#E94057] to-[#F27121] text-white">
            <Icon name="sparkle" size={19} />
          </span>
          <div className="min-w-[200px] flex-1">
            <p className="text-sm font-bold text-ink">{T("دع الذكاء الاصطناعي يكتب عنك", "Let the AI write it for you")}</p>
            <p className="mt-0.5 text-[13px] leading-5 text-muted">
              {T("يكتب عنواناً ووصفاً جاهزين من التفاصيل التي أدخلتها، ويمكنك تعديلهما بعد ذلك.", "It writes a ready title and description from the details you entered; you can edit both afterwards.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#8A2387] via-[#E94057] to-[#F27121] px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgb(233_64_87/0.3)] transition hover:brightness-105 disabled:opacity-80 max-sm:w-full"
          >
            {generating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="sparkle" size={17} />}
            {generating ? T("جاري توليد المحتوى...", "Writing…") : state.title || state.description ? T("إعادة الكتابة", "Write again") : T("اكتب الإعلان الآن", "Write my ad")}
          </button>
        </div>

        <FormRow
          id="field-title"
          label={T("عنوان الإعلان", "Ad title")}
          note={T("أول ما يراه الباحث. اذكر النوع والمنطقة وأبرز ميزة.", "The first thing people see. Mention the type, the area and the best feature.")}
          required
          answered={titleOk}
          invalid={!!errors.title}
        >
          <TextBox value={state.title} onChange={(title) => update({ title })} maxLength={TITLE_MAX} placeholder={T(`مثال: ${leafName} مميزة...`, `e.g. A lovely ${leafName}…`)} invalid={!!errors.title} />
          <p className="mt-2 flex items-center gap-3 text-xs text-muted">
            {meter(titleLength, TITLE_MIN, TITLE_MAX)}
            <span className={titleOk ? "font-semibold text-emerald-700" : ""} dir="ltr">
              {titleLength} / {TITLE_MAX}
            </span>
          </p>
          <FieldError message={message("title")} />
        </FormRow>

        <FormRow
          id="field-description"
          label={T("تفاصيل الإعلان", "Ad description")}
          note={T("المساحة، الطابق، حالة العقار، القرب من الخدمات، وشروطك.", "Size, floor, condition, nearby services and your terms.")}
          required
          answered={descriptionOk}
          invalid={!!errors.description}
        >
          <textarea
            value={state.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={7}
            dir="auto"
            aria-invalid={!!errors.description}
            placeholder={T("اكتب تفاصيل إعلانك هنا لجذب المهتمين...", "Describe your property to attract interest…")}
            className={`block w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-[15px] leading-7 text-ink placeholder:text-muted focus:outline-none focus:ring-4 ${
              errors.description ? "border-red-400 focus:ring-red-100" : "border-line focus:border-brand-600 focus:ring-brand-100"
            }`}
          />
          <p className="mt-2 flex items-center gap-3 text-xs text-muted">
            {meter(descriptionLength, DESCRIPTION_MIN, 0)}
            <span className={descriptionOk ? "font-semibold text-emerald-700" : ""}>
              {descriptionOk ? T(`${descriptionLength} حرفاً`, `${descriptionLength} characters`) : T(`${descriptionLength} من ${DESCRIPTION_MIN} حرفاً على الأقل`, `${descriptionLength} of at least ${DESCRIPTION_MIN} characters`)}
            </span>
          </p>
          <FieldError message={message("description")} />
        </FormRow>

        {!generating && state.tags.length > 0 && (
          <FormRow label={T("كلمات مفتاحية ذكية", "Smart tags")} note={T("اقترحها الذكاء الاصطناعي. أزل ما لا يناسبك.", "Suggested by the AI. Remove the ones that do not fit.")} answered={state.selectedTags.length > 0}>
            <div className="flex flex-wrap gap-2">
              {state.tags.map((tag) => {
                const selected = state.selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update({ selectedTags: selected ? state.selectedTags.filter((item) => item !== tag) : [...state.selectedTags, tag] })}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition ${
                      selected ? "border-[#E94057] bg-[#E94057] font-semibold text-white" : "border-line bg-white text-body hover:border-[#E94057]"
                    }`}
                  >
                    {selected && <Icon name="check" size={13} />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </FormRow>
        )}
      </FormCard>

      <FormCard title={T("التواصل", "Contact")} icon="phone" flush aside={badge(phoneOk)}>
        <FormRow
          id="field-phone"
          label={T("رقم الموبايل للتواصل", "Mobile number for contact")}
          note={T("يظهر للمهتمين عند الضغط على «إظهار الرقم» فقط.", "Shown to interested people only when they press “Show number”.")}
          required
          answered={phoneOk}
          invalid={!!errors.phone}
        >
          <div className="flex max-w-[300px] items-stretch gap-2" dir="ltr">
            <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-muted">+962</span>
            <div className="min-w-0 flex-1">
              <TextBox
                value={state.phone}
                onChange={(phone) => update({ phone: westernDigits(phone).replace(/\D/g, "").slice(0, 10) })}
                numeric
                placeholder="079XXXXXXX"
                invalid={!!errors.phone}
              />
            </div>
          </div>
          <FieldError message={message("phone")} />
        </FormRow>
      </FormCard>
    </div>
  );
}

interface PreviewProps {
  lang: Lang;
  state: WizardState;
  sections: Section[];
  context: FormContext;
  dynamic: DynamicData;
  /** Names for the preview card */
  names: { category: string; city: string; region: string };
  evaluation: { score: number; tips: string[] } | null;
  evaluating: boolean;
}

/** Step 8: the AI's rating, the ad as it will look in the lists, and all its details. */
export function PreviewStep({ lang, state, sections, context, dynamic, names, evaluation, evaluating }: PreviewProps) {
  const T = pick(lang);
  const number = (key: string) => {
    const value = typeof dynamic[key] === "string" ? parseInt((dynamic[key] as string).replace(/\D/g, ""), 10) : NaN;
    return Number.isFinite(value) ? value : null;
  };
  const list = (key: string) => (Array.isArray(dynamic[key]) ? (dynamic[key] as string[]) : []);
  const images = state.photos.map((photo) => photo.preview);
  const installments = state.payment === "أقساط";

  const card: AdCard = {
    id: 0,
    title: state.title.trim() || names.category,
    slug: "",
    price: installments ? null : amount(state.price) ?? null,
    deal: context.isRent ? "rent" : "sale",
    category_id: state.path[state.path.length - 1] ?? 0,
    category_name: names.category,
    city_id: state.cityId ?? null,
    region_id: state.regionId ?? null,
    city_ar: names.city,
    city_en: names.city,
    region_ar: names.region,
    region_en: names.region,
    image: images[0] ?? null,
    images,
    images_count: images.length,
    excerpt: state.description.trim().replace(/\s+/g, " ").slice(0, 180),
    floor: typeof dynamic.floor === "string" ? dynamic.floor : null,
    tags: [...(list("rent_duration").slice(0, 1)), typeof dynamic.furnishing === "string" ? dynamic.furnishing : "", ...list("main_features").slice(0, 3), ...list("extra_features").slice(0, 2)].filter(Boolean),
    phone: state.phone,
    is_organic: true,
    bedrooms: number("bedrooms"),
    bathrooms: number("bathrooms"),
    area: number("area") ?? number("build_area"),
    furnished: null,
    rating_avg: null,
    reviews_count: 0,
    created_at: new Date().toISOString(),
  };

  const score = evaluation?.score ?? 0;
  const tone = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-500" : "text-red-500";
  const rows = sections.flatMap((section) =>
    section.fields
      .filter((field) => field.kind !== "note" && isShown(field, dynamic, context))
      .map((field) => {
        const raw = dynamic[field.key];
        const value = Array.isArray(raw) ? raw.map((item) => optionLabel(item, lang)).join(lang === "ar" ? "، " : ", ") : typeof raw === "string" ? optionLabel(raw, lang) : "";
        return value ? { key: field.key, label: field.label[lang], value: field.unit && field.kind === "measure" ? `${value} ${field.unit[lang]}` : value } : null;
      })
      .filter((row): row is { key: string; label: string; value: string } => row !== null),
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#8A2387] to-[#F27121] text-white">
            <Icon name="sparkle" size={18} />
          </span>
          {T("تقييم الذكاء الاصطناعي للإعلان", "AI rating of your ad")}
        </h2>
        {evaluating ? (
          <div className="mt-5 flex items-center gap-3 text-sm text-muted">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            {T("جاري تحليل إعلانك...", "Analysing your ad…")}
          </div>
        ) : evaluation ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <div className="relative mx-auto h-24 w-24">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-line)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`} className={tone} />
              </svg>
              <span className={`absolute inset-0 flex flex-col items-center justify-center font-bold ${tone}`}>
                <span className="text-2xl leading-none">{score}</span>
                <span className="mt-0.5 text-[11px] text-muted">/ 100</span>
              </span>
            </div>
            <ul className="space-y-2.5">
              {evaluation.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-[15px] leading-7 text-body">
                  <Icon name="check" size={17} className="mt-1.5 shrink-0 text-brand-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">{T("تأكد من مراجعة التفاصيل قبل النشر.", "Review the details before publishing.")}</p>
        )}
      </section>

      <section>
        <h2 className="text-base font-bold text-ink">{T("1. شكل الإعلان في القوائم", "1. How the ad looks in the lists")}</h2>
        <p className="mb-3 mt-1 text-sm text-muted">{T("هذا ما سيراه المستخدمون أثناء تصفح الأقسام.", "This is what people see while browsing.")}</p>
        {/* A picture of the card, not the card itself: its links and buttons lead nowhere yet */}
        <div className="pointer-events-none select-none" aria-hidden="true">
          <AdRowCard ad={card} locale={lang} />
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold text-ink">{T("2. تفاصيل الإعلان بالكامل", "2. The full details")}</h2>
        <p className="mb-3 mt-1 text-sm text-muted">{T("هكذا ستظهر تفاصيل ومواصفات إعلانك للمستخدمين.", "This is how your ad's details will be shown.")}</p>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
            <h3 className="text-lg font-bold text-ink">{card.title}</h3>
            <p className="text-xl font-bold text-brand-700">
              {installments ? T("أقساط", "Instalments") : `${(amount(state.price) ?? 0).toLocaleString("en-US")} ${T("د.أ", "JOD")}`}
            </p>
          </div>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-body" dir="auto">{state.description.trim()}</p>
          {state.selectedTags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {state.selectedTags.map((tag) => (
                <li key={tag} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{tag}</li>
              ))}
            </ul>
          )}
          <dl className="mt-5 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { key: "_category", label: T("القسم", "Category"), value: names.category },
              { key: "_place", label: T("الموقع", "Location"), value: `${names.region}${lang === "ar" ? "، " : ", "}${names.city}` },
              ...(!context.isRent ? [{ key: "_payment", label: T("طريقة الدفع", "Payment"), value: optionLabel(state.payment, lang) }] : []),
              ...(state.payment !== "كاش" && amount(state.down) ? [{ key: "_down", label: T("دفعة أولى", "Down payment"), value: `${(amount(state.down) as number).toLocaleString("en-US")} ${T("د.أ", "JOD")}` }] : []),
              ...rows,
              { key: "_phone", label: T("رقم التواصل", "Contact number"), value: state.phone },
              ...(state.video ? [{ key: "_video", label: T("الفيديو", "Video"), value: T("مرفق", "Attached") }] : []),
            ].map((row) => (
              <div key={row.key} className="flex items-start justify-between gap-4 border-b border-line py-2.5 text-sm">
                <dt className="shrink-0 text-muted">{row.label}</dt>
                <dd className="text-end font-semibold text-ink" dir="auto">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
