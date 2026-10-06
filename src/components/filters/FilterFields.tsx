"use client";

import { type ReactNode, useEffect, useState } from "react";
import Icon from "../Icon";
import { type FilterOptions, type FilterValue, type Furnishing, filterScope, parseNumber, toggle } from "./shared";

interface Props {
  options: FilterOptions;
  /** The filters currently applied */
  value: FilterValue;
  onCommit: (next: FilterValue) => void;
  /**
   * "instant": a choice is applied straight away; typed numbers apply on Enter or on leaving the field.
   * "sheet": every change is reported immediately and the sheet's own button applies them together.
   */
  mode: "instant" | "sheet";
}

/** Slider scales. The top of the scale means "no upper limit". */
const RENT_SCALE = { top: 2000, step: 50 };
const SALE_SCALE = { top: 500_000, step: 5000 };
/** Sections that start open; the rest open when they hold a choice or are clicked */
const OPEN_BY_DEFAULT = new Set(["price", "beds", "baths", "furnishing", "area", "floor", "dur", "zoning", "ltype"]);
/** Longer lists show this many options until "show all" is pressed */
const VISIBLE_OPTIONS = 6;

const text = (value?: number) => (value ? String(value) : "");

export default function FilterFields({ options, value, onCommit, mode }: Props) {
  const L = options.labels;
  const lang = options.locale;
  const [min, setMin] = useState(text(value.min));
  const [max, setMax] = useState(text(value.max));
  const [amin, setAmin] = useState(text(value.amin));
  const [amax, setAmax] = useState(text(value.amax));
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Applied values can change from outside ("clear all", a removed bubble, another page).
  // The box is only rewritten when it disagrees, so it never fights what is being typed.
  useEffect(() => setMin((current) => (parseNumber(current) === value.min ? current : text(value.min))), [value.min]);
  useEffect(() => setMax((current) => (parseNumber(current) === value.max ? current : text(value.max))), [value.max]);
  useEffect(() => setAmin((current) => (parseNumber(current) === value.amin ? current : text(value.amin))), [value.amin]);
  useEffect(() => setAmax((current) => (parseNumber(current) === value.amax ? current : text(value.amax))), [value.amax]);

  const scope = filterScope(options, value);
  const scale = scope.isRent ? RENT_SCALE : SALE_SCALE;

  /** Reads the four number boxes; a reversed range is put the right way round. */
  const withNumbers = (overrides: Partial<Record<"min" | "max" | "amin" | "amax", string>> = {}): FilterValue => {
    const read = (key: "min" | "max" | "amin" | "amax", current: string) => parseNumber(overrides[key] ?? current);
    let low = read("min", min);
    let high = read("max", max);
    if (low && high && low > high) [low, high] = [high, low];
    let areaLow = read("amin", amin);
    let areaHigh = read("amax", amax);
    if (areaLow && areaHigh && areaLow > areaHigh) [areaLow, areaHigh] = [areaHigh, areaLow];
    return { ...value, min: low, max: high, amin: areaLow, amax: areaHigh };
  };

  const commitNumbers = (overrides: Partial<Record<"min" | "max" | "amin" | "amax", string>> = {}) => {
    const next = withNumbers(overrides);
    if (next.min !== value.min || next.max !== value.max || next.amin !== value.amin || next.amax !== value.amax) onCommit(next);
  };

  const numberField = (label: string, unit: string, current: string, set: (v: string) => void, key: "min" | "max" | "amin" | "amax") => (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <input
        className="field h-12 pe-11 text-start font-semibold"
        inputMode="numeric"
        enterKeyHint="go"
        placeholder={label}
        value={current}
        onChange={(event) => {
          set(event.target.value);
          if (mode === "sheet") onCommit(withNumbers({ [key]: event.target.value }));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitNumbers();
          }
        }}
        onBlur={() => mode === "instant" && commitNumbers()}
      />
      <span className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">{unit}</span>
    </label>
  );

  /** Equal-width buttons joined in one bar: the quickest way to pick small numbers. */
  const segmented = (items: { key: string; label: string; selected: boolean; wide?: boolean; onClick: () => void }[]) => (
    <div
      className="grid overflow-hidden rounded-xl border border-line"
      style={{ gridTemplateColumns: `repeat(${items.reduce((sum, item) => sum + (item.wide ? 2 : 1), 0)}, minmax(0, 1fr))` }}
    >
      {items.map((item, i) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={item.selected}
          onClick={item.onClick}
          style={item.wide ? { gridColumn: "span 2" } : undefined}
          className={`h-11 whitespace-nowrap px-1 text-[13px] font-semibold transition ${i > 0 ? "border-s border-line" : ""} ${
            item.selected ? "bg-brand-600 text-white" : "bg-white text-ink hover:bg-surface"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  /** A tick list; long lists are cut short until "show all" is pressed. */
  const checklist = (key: string, items: { key: string; label: string; selected: boolean; onClick: () => void }[]) => {
    const short = items.every((item) => item.label.length <= 12);
    const showAll = expanded[key] || items.length <= VISIBLE_OPTIONS + 1 || items.slice(VISIBLE_OPTIONS).some((item) => item.selected);
    const shown = showAll ? items : items.slice(0, VISIBLE_OPTIONS);
    return (
      <>
        <ul className={`grid gap-x-3 gap-y-0.5 ${short ? "grid-cols-2" : "grid-cols-1"}`}>
          {shown.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                role="checkbox"
                aria-checked={item.selected}
                onClick={item.onClick}
                className="group flex w-full items-center gap-2.5 rounded-lg py-2 text-start text-sm"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    item.selected ? "border-brand-600 bg-brand-600 text-white" : "border-[#c9cfda] bg-white group-hover:border-brand-600"
                  }`}
                >
                  {item.selected && <Icon name="check" size={13} />}
                </span>
                <span className={`min-w-0 truncate ${item.selected ? "font-semibold text-ink" : "text-body group-hover:text-ink"}`}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
        {!showAll && (
          <button type="button" onClick={() => setExpanded((current) => ({ ...current, [key]: true }))} className="mt-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            {L.showAll} ({items.length})
          </button>
        )}
      </>
    );
  };

  /** A collapsible block; its header shows how many choices it holds and can clear them. */
  const section = (key: string, title: string, chosen: number, onClear: () => void, children: ReactNode, hint?: string) => {
    const open = toggled[key] ?? (OPEN_BY_DEFAULT.has(key) || chosen > 0);
    return (
      <section key={key} className="border-b border-line last:border-b-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setToggled((current) => ({ ...current, [key]: !open }))}
            className="flex min-w-0 flex-1 items-center gap-2 py-4 text-start"
          >
            <Icon name="chevron" size={14} className={`shrink-0 text-muted transition ${open ? "rotate-90" : "rtl:rotate-180"}`} />
            <span className="truncate text-[15px] font-bold text-ink first-letter:uppercase">{title}</span>
            {hint && <span className="shrink-0 text-xs text-muted">{hint}</span>}
          </button>
          {chosen > 0 && (
            <button type="button" onClick={onClear} className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">
              {L.clearOne}
              {chosen > 1 ? ` (${chosen})` : ""}
            </button>
          )}
        </div>
        {open && <div className="pb-5">{children}</div>}
      </section>
    );
  };

  // Price slider: its two ends mean "no limit"
  const low = Math.min(parseNumber(min) ?? 0, scale.top);
  const high = Math.min(parseNumber(max) ?? scale.top, scale.top);
  const lowPct = (Math.min(low, high) / scale.top) * 100;
  const highPct = (Math.max(low, high) / scale.top) * 100;
  const sliderText = (amount: number) => (amount <= 0 || amount >= scale.top ? "" : String(amount));
  const number = (amount: number) => amount.toLocaleString("en-US");
  const priceSummary =
    low > 0 && high < scale.top
      ? `${number(low)} – ${number(high)} ${L.currency}`
      : high < scale.top
        ? `${L.upTo} ${number(high)} ${L.currency}`
        : low > 0
          ? `${L.from} ${number(low)} ${L.currency}`
          : L.anyPrice;
  const releaseSlider = () => mode === "instant" && commitNumbers();
  const slide = (key: "min" | "max", raw: string) => {
    let amount = Number(raw);
    // The two handles never cross
    if (key === "min") amount = Math.min(amount, high - scale.step);
    else amount = Math.max(amount, low + scale.step);
    const next = sliderText(amount);
    if (key === "min") setMin(next);
    else setMax(next);
    if (mode === "sheet") onCommit(withNumbers({ [key]: next }));
  };
  const sliderEvents = { onPointerUp: releaseSlider, onKeyUp: releaseSlider, onTouchEnd: releaseSlider };

  const furnishing: [Furnishing, string][] = [["yes", L.furnished], ["no", L.unfurnished], ["partial", L.partlyFurnished]];

  return (
    <div>
      {section(
        "price",
        L.price,
        value.min || value.max ? 1 : 0,
        () => {
          setMin("");
          setMax("");
          onCommit({ ...withNumbers({ min: "", max: "" }) });
        },
        <>
          <p className="mb-3 text-sm font-semibold text-brand-700">{priceSummary}</p>
          <div className="range-pair relative mx-1 mb-5 h-6">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
            <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-600" style={{ insetInlineStart: `${lowPct}%`, insetInlineEnd: `${100 - highPct}%` }} />
            <input type="range" aria-label={L.from} min={0} max={scale.top} step={scale.step} value={low} onChange={(event) => slide("min", event.target.value)} {...sliderEvents} />
            <input type="range" aria-label={L.to} min={0} max={scale.top} step={scale.step} value={high} onChange={(event) => slide("max", event.target.value)} {...sliderEvents} />
          </div>
          <div className="flex items-center gap-2.5">
            {numberField(L.minimum, L.currency, min, setMin, "min")}
            <span className="h-px w-3 shrink-0 bg-[#c9cfda]" />
            {numberField(L.maximum, L.currency, max, setMax, "max")}
          </div>
        </>,
        scope.isRent ? L.perMonth : undefined,
      )}

      {scope.beds &&
        section(
          "beds",
          L.beds,
          value.beds?.length ?? 0,
          () => onCommit({ ...withNumbers(), beds: undefined }),
          segmented(
            // Houses and villas are never studios
            (scope.traits.house ? [1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6]).map((n) => ({
              key: String(n),
              label: n === 0 ? L.studio : n === 6 ? "6+" : String(n),
              wide: n === 0,
              selected: !!value.beds?.includes(n),
              onClick: () => onCommit({ ...withNumbers(), beds: toggle(value.beds, n) }),
            })),
          ),
        )}

      {scope.baths &&
        section(
          "baths",
          L.baths,
          value.baths?.length ?? 0,
          () => onCommit({ ...withNumbers(), baths: undefined }),
          segmented(
            [1, 2, 3, 4, 5, 6].map((n) => ({
              key: String(n),
              label: n === 6 ? "6+" : String(n),
              selected: !!value.baths?.includes(n),
              onClick: () => onCommit({ ...withNumbers(), baths: toggle(value.baths, n) }),
            })),
          ),
        )}

      {scope.furnishing &&
        section(
          "furnishing",
          L.furnishing,
          value.furnished ? 1 : 0,
          () => onCommit({ ...withNumbers(), furnished: undefined }),
          segmented(
            furnishing.map(([key, label]) => ({
              key,
              label,
              selected: value.furnished === key,
              onClick: () => onCommit({ ...withNumbers(), furnished: value.furnished === key ? undefined : key }),
            })),
          ),
        )}

      {section(
        "area",
        L.area,
        value.amin || value.amax ? 1 : 0,
        () => {
          setAmin("");
          setAmax("");
          onCommit({ ...withNumbers({ amin: "", amax: "" }) });
        },
        <div className="flex items-center gap-2.5">
          {numberField(L.minimum, L.sqm, amin, setAmin, "amin")}
          <span className="h-px w-3 shrink-0 bg-[#c9cfda]" />
          {numberField(L.maximum, L.sqm, amax, setAmax, "amax")}
        </div>,
      )}

      {scope.facets.map((facet) => {
        const chosen = value.facets?.[facet.key] ?? [];
        const withFacet = (next?: number[]) => {
          const facets = { ...value.facets };
          if (next?.length) facets[facet.key] = next;
          else delete facets[facet.key];
          return { ...withNumbers(), facets: Object.keys(facets).length ? facets : undefined };
        };
        return section(
          facet.key,
          facet.label[lang],
          chosen.length,
          () => onCommit(withFacet(undefined)),
          checklist(
            facet.key,
            facet.options.map((option, i) => ({
              key: String(i),
              label: option.label[lang],
              selected: chosen.includes(i + 1),
              onClick: () => onCommit(withFacet(toggle(chosen, i + 1))),
            })),
          ),
        );
      })}
    </div>
  );
}
