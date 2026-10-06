"use client";

import { type DynamicData, type Field, type FormContext, type Lang, type Section, isShown } from "@/lib/post/schema";
import Icon from "../Icon";
import { CheckGroup, FieldError, FormCard, RadioChips, TextBox, TipBanner } from "./fields";
import { pick } from "./types";

interface Props {
  lang: Lang;
  sections: Section[];
  context: FormContext;
  data: DynamicData;
  onChange: (key: string, value: string | string[]) => void;
  /** Keys of required fields left empty, shown after "next" was pressed */
  missing: string[];
}

/** Step 6: the questions for this kind of property, exactly the app's. */
export default function DetailsStep({ lang, sections, context, data, onChange, missing }: Props) {
  const T = pick(lang);
  const set = onChange;
  const text = (key: string) => (typeof data[key] === "string" ? (data[key] as string) : "");
  const list = (key: string) => (Array.isArray(data[key]) ? (data[key] as string[]) : []);

  /** One question: its name at the side on wide screens, above on phones; the answer beside or under it. */
  const renderField = (field: Field) => {
    if (field.kind === "note") {
      return (
        <p key={field.key} className="flex items-start gap-2.5 border-b border-line bg-orange-50 px-5 py-3 text-[13px] font-semibold leading-6 text-orange-700 last:border-b-0 sm:px-6">
          <Icon name="alert" size={16} className="mt-1 shrink-0" />
          {field.label[lang]}
        </p>
      );
    }
    const required = field.kind !== "checks" && field.required !== false;
    const invalid = missing.includes(field.key);
    const answered = field.kind === "checks" ? list(field.key).length > 0 : text(field.key).trim() !== "";
    return (
      <div
        key={field.key}
        id={`field-${field.key}`}
        className={`grid scroll-mt-40 gap-x-8 gap-y-2.5 border-b border-line px-5 py-5 last:border-b-0 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)] ${invalid ? "bg-red-50/40" : ""}`}
      >
        <div className="lg:pt-2.5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
            {field.label[lang]}
            {required && <span className="text-red-500">*</span>}
            {answered && <Icon name="check" size={14} className="text-emerald-500" />}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {field.kind === "checks" ? T("اختياري · يمكن اختيار أكثر من خيار", "Optional · choose any that apply") : required ? T("مطلوب", "Required") : T("اختياري", "Optional")}
          </p>
        </div>
        <div className="min-w-0">
          {field.kind === "radio" && <RadioChips options={field.options ?? []} value={text(field.key)} onChange={(value) => set(field.key, value)} lang={lang} invalid={invalid} />}
          {field.kind === "checks" && <CheckGroup options={field.options ?? []} value={list(field.key)} onChange={(value) => set(field.key, value)} lang={lang} />}
          {field.kind === "measure" && (
            <div className="max-w-[260px]">
              <TextBox value={text(field.key)} onChange={(value) => set(field.key, value)} unit={field.unit?.[lang]} numeric invalid={invalid} placeholder="0" />
            </div>
          )}
          {field.kind === "text" && (
            <div className={field.numeric ? "max-w-[260px]" : "max-w-xl"}>
              <TextBox value={text(field.key)} onChange={(value) => set(field.key, value)} numeric={field.numeric} invalid={invalid} />
            </div>
          )}
          <FieldError
            message={invalid ? (field.kind === "radio" ? T("الرجاء اختيار أحد الخيارات لتتمكن من المتابعة", "Please choose one of the options to continue") : T("هذا الحقل مطلوب", "This field is required")) : undefined}
          />
        </div>
      </div>
    );
  };

  const isRequired = (field: Field) => field.kind !== "note" && field.kind !== "checks" && field.required !== false;

  return (
    <div className="space-y-5">
      <TipBanner
        title={T("نصيحة لإعلان أقوى ⚡", "A tip for a stronger ad ⚡")}
        message={T(
          "كلما كانت التفاصيل أدق، وصل إعلانك إلى الباحث المناسب أسرع. الحقول المعلّمة بنجمة مطلوبة.",
          "The more exact the details, the faster your ad reaches the right person. Fields marked with a star are required.",
        )}
      />
      {sections.map((section) => {
        const visible = section.fields.filter((field) => isShown(field, data, context));
        const required = visible.filter(isRequired);
        const filled = required.filter((field) => text(field.key).trim() !== "").length;
        const complete = filled === required.length;
        return (
          <FormCard
            key={section.title.ar}
            title={section.title[lang]}
            icon={section.icon}
            flush
            aside={
              required.length > 0 ? (
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${complete ? "bg-emerald-50 text-emerald-700" : "bg-white text-muted shadow-card"}`}>
                  {complete && <Icon name="check" size={13} />}
                  <span dir="ltr">
                    {filled} / {required.length}
                  </span>
                  {T("مطلوب", "required")}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-muted shadow-card">{T("اختياري", "Optional")}</span>
              )
            }
          >
            {visible.map(renderField)}
          </FormCard>
        );
      })}
    </div>
  );
}
