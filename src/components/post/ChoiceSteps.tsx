"use client";

import { useMemo, useState } from "react";
import { normalizeArabic } from "@/components/filters/shared";
import { MAIN_CATEGORIES, POPULAR_AREAS, RENT_ROOT, shownName } from "@/lib/post/schema";
import Icon from "../Icon";
import { PickRow, SearchBox } from "./fields";
import { type StepProps, pick } from "./types";

const matches = (name: string, query: string) => normalizeArabic(name).includes(normalizeArabic(query));

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-line bg-white px-6 py-12 text-center">
      <Icon name="search" size={40} className="mx-auto text-line" />
      <p className="mt-3 text-[15px] font-semibold text-muted">{text}</p>
    </div>
  );
}

/**
 * Step 3: the section. First "rent" or "sale", then one level at a time down
 * the category tree until a category with nothing under it is reached.
 */
export function CategoryStep({ lang, state, update, categories, onDone }: StepProps & { onDone: () => void }) {
  const T = pick(lang);
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const childrenOf = (id: number) => categories.filter((c) => c.parentId === id);

  // The level being chosen: under the last chosen category that still has children
  const chosen = state.path.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
  const last = chosen[chosen.length - 1];
  const lastIsLeaf = !!last && childrenOf(last.id).length === 0;
  const parent = lastIsLeaf ? chosen[chosen.length - 2] : last;
  const depth = lastIsLeaf ? chosen.length - 1 : chosen.length;

  const options = parent ? childrenOf(parent.id) : MAIN_CATEGORIES.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
  const shown = query ? options.filter((option) => matches(shownName(option), query)) : options;

  const choose = (id: number) => {
    setQuery("");
    const path = [...state.path.slice(0, depth), id];
    const leaf = childrenOf(id).length === 0;
    // A different category means different detail questions
    update({ path, ...(state.path.join() !== path.join() ? { dynamic: {} } : {}) });
    if (leaf) onDone();
  };

  const mainNote = (id: number) =>
    id === RENT_ROOT
      ? T("شقق، بيوت، محلات ومكاتب للإيجار الشهري أو السنوي أو اليومي", "Apartments, houses, shops and offices to rent")
      : T("شقق، فلل، أراضي، مزارع ومحلات تجارية للبيع", "Apartments, villas, lands, farms and shops for sale");

  return (
    <div className="space-y-5">
      {depth > 0 && (
        <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label={T("المسار", "Path")}>
          <button type="button" onClick={() => update({ path: [], dynamic: {} })} className="rounded-full border border-line bg-white px-3 py-1 text-[13px] font-semibold text-brand-700 hover:bg-brand-50">
            {T("الأقسام الرئيسية", "Main sections")}
          </button>
          {chosen.slice(0, depth).map((category, index) => (
            <span key={category.id} className="flex items-center gap-2">
              <Icon name="chevron" size={13} className="text-muted rtl:rotate-180" />
              <button
                type="button"
                onClick={() => update({ path: state.path.slice(0, index + 1), dynamic: {} })}
                className="rounded-full border border-line bg-white px-3 py-1 text-[13px] font-semibold text-ink hover:bg-brand-50"
              >
                {shownName(category)}
              </button>
            </span>
          ))}
        </nav>
      )}

      <h2 className="text-base font-bold text-ink">{depth === 0 ? T("الأقسام الرئيسية", "Main sections") : T("التصنيفات المتاحة", "Available categories")}</h2>
      <SearchBox value={query} onChange={setQuery} placeholder={depth === 0 ? T("ابحث عن قسم...", "Search sections…") : T("ابحث عن تصنيف...", "Search categories…")} />

      {shown.length === 0 ? (
        <Empty text={T("لا توجد تصنيفات مطابقة", "No matching categories")} />
      ) : (
        <div className={depth === 0 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
          {shown.map((option) => (
            <PickRow
              key={option.id}
              title={shownName(option)}
              note={depth === 0 ? mainNote(option.id) : undefined}
              icon={depth === 0 ? (option.id === RENT_ROOT ? "door" : "home") : undefined}
              selected={state.path[depth] === option.id}
              arrow={childrenOf(option.id).length > 0}
              onClick={() => choose(option.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Step 4: the governorate. */
export function CityStep({ lang, state, update, cities, onDone }: StepProps & { onDone: () => void }) {
  const T = pick(lang);
  const [query, setQuery] = useState("");
  const shown = query ? cities.filter((city) => matches(city.name, query)) : cities;

  return (
    <div className="space-y-5">
      <SearchBox value={query} onChange={setQuery} placeholder={T("ابحث عن المحافظة...", "Search governorates…")} />
      {shown.length === 0 ? (
        <Empty text={T(`لم نتمكن من العثور على "${query}"`, `Nothing found for "${query}"`)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((city) => (
            <PickRow
              key={city.id}
              title={city.name}
              icon="pin"
              selected={state.cityId === city.id}
              arrow
              onClick={() => {
                // Areas belong to a governorate, so a new one clears the area
                update({ cityId: city.id, ...(state.cityId !== city.id ? { regionId: undefined } : {}) });
                onDone();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Step 5: the area. The most-searched areas of the governorate come first, then the full list. */
export function AreaStep({ lang, state, cities, areas, onPick, busy }: StepProps & { onPick: (areaId: number) => void; busy: boolean }) {
  const T = pick(lang);
  const [query, setQuery] = useState("");
  const city = cities.find((c) => c.id === state.cityId);
  const own = useMemo(() => areas.filter((area) => area.cityId === state.cityId), [areas, state.cityId]);

  // The app's list of popular names, matched to this governorate's areas whatever the spelling variant
  const popular = useMemo(() => {
    const cityKey = Object.keys(POPULAR_AREAS).find((name) => city && normalizeArabic(name) === normalizeArabic(city.name));
    const names = cityKey ? POPULAR_AREAS[cityKey] : [];
    const found = names.map((name) => own.find((area) => normalizeArabic(area.name) === normalizeArabic(name))).filter((a): a is NonNullable<typeof a> => !!a);
    return found.length ? found : own.slice(0, 5);
  }, [city, own]);

  const shown = query ? own.filter((area) => matches(area.name, query)) : own;

  return (
    <div className="space-y-6">
      <SearchBox value={query} onChange={setQuery} placeholder={T("ابحث عن الحي أو المنطقة...", "Search neighbourhoods and areas…")} />

      {!query && popular.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-base font-bold text-ink">{T("الأحياء الأكثر بحثاً 🔥", "Most searched areas 🔥")}</h2>
          <div className="flex flex-wrap gap-2.5">
            {popular.map((area) => (
              <button
                key={area.id}
                type="button"
                disabled={busy}
                onClick={() => onPick(area.id)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition disabled:opacity-60 ${
                  state.regionId === area.id ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink hover:border-brand-500"
                }`}
              >
                <Icon name="pin" size={15} />
                {area.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2.5 text-base font-bold text-ink">
          {query ? T(`نتائج البحث (${shown.length})`, `Search results (${shown.length})`) : T("دليل المناطق الشامل", "All areas")}
        </h2>
        {shown.length === 0 ? (
          <Empty text={T(`لم نتمكن من العثور على "${query}"`, `Nothing found for "${query}"`)} />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((area) => (
              <PickRow key={area.id} title={area.name} selected={state.regionId === area.id} arrow disabled={busy} onClick={() => onPick(area.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
