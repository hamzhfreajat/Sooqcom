"use client";

import type { ReactNode } from "react";
import { type Lang, optionLabel, westernDigits } from "@/lib/post/schema";
import Icon from "../Icon";

/** A white block of the form: an icon, a title, an optional note at the end of the title row, then its rows. */
export function FormCard({ title, icon, aside, flush = false, children }: { title?: string; icon?: string; aside?: ReactNode; flush?: boolean; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      {title && (
        <header className="flex items-center gap-3 border-b border-line bg-surface/50 px-5 py-3.5 sm:px-6">
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-card">
              <Icon name={icon} size={17} />
            </span>
          )}
          <h2 className="min-w-0 flex-1 truncate text-base font-bold text-ink">{title}</h2>
          {aside}
        </header>
      )}
      <div className={flush ? "" : "space-y-6 p-5 sm:p-6"}>{children}</div>
    </section>
  );
}

/**
 * One question of a form: its name and a short note at the side on wide screens
 * (above on phones), the answer beside it. Rows are separated by thin lines.
 */
export function FormRow({
  id,
  label,
  note,
  required = false,
  answered = false,
  invalid = false,
  children,
}: {
  id?: string;
  label: string;
  note?: string;
  required?: boolean;
  answered?: boolean;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className={`grid scroll-mt-40 gap-x-8 gap-y-2.5 border-b border-line px-5 py-5 last:border-b-0 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)] ${invalid ? "bg-red-50/40" : ""}`}
    >
      <div className="lg:pt-2.5">
        <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
          {label}
          {required && <span className="text-red-500">*</span>}
          {answered && <Icon name="check" size={14} className="text-emerald-500" />}
        </p>
        {note && <p className="mt-0.5 text-xs leading-5 text-muted">{note}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function FieldLabel({ label, required, optionalText }: { label: string; required: boolean; optionalText: string }) {
  return (
    <p className="mb-2.5 flex items-center gap-1.5 text-sm font-bold text-ink">
      {label}
      {required ? <span className="text-base text-red-500">*</span> : <span className="text-[13px] font-normal text-muted">({optionalText})</span>}
    </p>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
      <Icon name="alert" size={15} />
      {message}
    </p>
  );
}

/**
 * One choice out of several.
 *   A few short options (numbers, yes/no): one joined bar of equal buttons.
 *   Longer lists: a grid of equal tiles, so the options line up in columns.
 */
export function RadioChips({
  options,
  value,
  onChange,
  lang,
  invalid,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  lang: Lang;
  invalid?: boolean;
}) {
  const labels = options.map((option) => optionLabel(option, lang));
  const longest = Math.max(...labels.map((label) => label.length));
  const joined = options.length <= 6 && longest <= 16;

  if (joined) {
    // Wide enough for the longest label, so every button is the same size
    const width = Math.max(56, Math.min(150, longest * 9 + 34));
    return (
      <div
        role="radiogroup"
        className={`inline-grid max-w-full overflow-hidden rounded-xl border bg-white ${invalid ? "border-red-400 ring-4 ring-red-100" : "border-line"}`}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, ${width}px))` }}
      >
        {options.map((option, index) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? "" : option)}
              className={`h-11 truncate px-2 text-sm transition ${index > 0 ? "border-s border-line" : ""} ${
                selected ? "bg-brand-600 font-bold text-white" : "font-medium text-ink hover:bg-brand-50"
              }`}
            >
              {labels[index]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="radiogroup" className={`grid grid-cols-2 gap-2 rounded-xl sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] ${invalid ? "ring-4 ring-red-100" : ""}`}>
      {options.map((option, index) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? "" : option)}
            className={`flex h-11 items-center gap-2.5 rounded-xl border px-3 text-start text-sm transition ${
              selected ? "border-brand-600 bg-brand-50 font-bold text-brand-700" : invalid ? "border-red-300 bg-white font-medium text-ink hover:border-brand-500" : "border-line bg-white font-medium text-ink hover:border-brand-500"
            }`}
          >
            <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand-600" : "border-[#c2c9d6]"}`}>
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
            </span>
            <span className="min-w-0 truncate">{labels[index]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Any number of choices: a grid of equal tick tiles. */
export function CheckGroup({ options, value, onChange, lang }: { options: string[]; value: string[]; onChange: (value: string[]) => void; lang: Lang }) {
  const longest = Math.max(...options.map((option) => optionLabel(option, lang).length));
  // Long sentences get wider tiles so they stay on one line
  const columns = longest > 26 ? "sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]" : longest > 14 ? "sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]" : "sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]";
  return (
    <div className={`grid gap-2 ${longest > 18 ? "grid-cols-1" : "grid-cols-2"} ${columns}`}>
      {options.map((option) => {
        const checked = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => onChange(checked ? value.filter((item) => item !== option) : [...value, option])}
            className={`flex h-11 items-center gap-2.5 rounded-xl border px-3 text-start text-sm transition ${
              checked ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-line bg-white text-ink hover:border-brand-500"
            }`}
          >
            <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border ${checked ? "border-brand-600 bg-brand-600 text-white" : "border-[#c2c9d6] bg-white"}`}>
              {checked && <Icon name="check" size={12} />}
            </span>
            <span className="min-w-0 truncate">{optionLabel(option, lang)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A text box, optionally numbers only and with a unit at its end. */
export function TextBox({
  value,
  onChange,
  unit,
  numeric,
  placeholder,
  invalid,
  centered,
  maxLength,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  numeric?: boolean;
  placeholder?: string;
  invalid?: boolean;
  centered?: boolean;
  maxLength?: number;
  icon?: string;
}) {
  return (
    <div className="relative">
      {icon && <Icon name={icon} size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />}
      <input
        value={value}
        inputMode={numeric ? "decimal" : undefined}
        dir={numeric ? "ltr" : undefined}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={invalid}
        onChange={(event) => onChange(numeric ? westernDigits(event.target.value).replace(/[^\d.]/g, "") : event.target.value)}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-muted focus:outline-none focus:ring-4 ${
          invalid ? "border-red-400 focus:ring-red-100" : "border-line focus:border-brand-600 focus:ring-brand-100"
        } ${centered ? "text-center" : numeric ? "text-end" : ""} ${unit ? "pe-20" : ""} ${icon ? "ps-11" : ""}`}
      />
      {unit && <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">{unit}</span>}
    </div>
  );
}

/** The app's tip strip at the top of a step. */
export function TipBanner({ title, message }: { title: string; message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-[13px] leading-6 text-amber-900">
      <Icon name="sparkle" size={15} className="mt-1 shrink-0 text-amber-500" />
      <span>
        <span className="font-bold">{title}</span> {message}
      </span>
    </p>
  );
}

/** A search box for the long lists (sections, governorates, areas). */
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Icon name="search" size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-line bg-white pe-11 ps-11 text-[15px] text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="clear" className="absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

/** A row in a pick-one list: name, optional note, and an arrow or a tick. */
export function PickRow({
  title,
  note,
  icon,
  selected,
  arrow,
  onClick,
  disabled,
}: {
  title: string;
  note?: string;
  icon?: string;
  selected?: boolean;
  arrow?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-start transition hover:border-brand-500 hover:shadow-card disabled:opacity-60 ${
        selected ? "border-brand-600 bg-brand-50 shadow-[inset_0_0_0_1px_var(--color-brand-600)]" : "border-line"
      }`}
    >
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon name={icon} size={17} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] ${selected ? "font-bold text-brand-700" : "font-semibold text-ink"}`}>{title}</span>
        {note && <span className="mt-0.5 block truncate text-xs text-muted">{note}</span>}
      </span>
      {selected ? <Icon name="check" size={19} className="shrink-0 text-brand-600" /> : arrow ? <Icon name="chevron" size={15} className="shrink-0 text-muted rtl:rotate-180" /> : null}
    </button>
  );
}
