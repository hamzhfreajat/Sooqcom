"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import CategoryLevels from "./CategoryLevels";
import FilterFields from "./FilterFields";
import LocationSearch, { openAreasOf } from "./LocationSearch";
import {
  type FilterOptions,
  type FilterValue,
  activeChips,
  announceNavigation,
  buildListingUrl,
  childCategories,
  filterScope,
  panelFilterCount,
  pruneFilters,
} from "./shared";

interface FiltersContext {
  options: FilterOptions;
  value: FilterValue;
  popular: { id: number; count: number }[];
  categoryCounts: Map<number, number>;
  go: (next: FilterValue) => void;
}

const Context = createContext<FiltersContext | null>(null);

function useFilters(): FiltersContext {
  const context = useContext(Context);
  if (!context) throw new Error("Listing filters must be rendered inside <FiltersProvider>");
  return context;
}

/**
 * Holds the listing page's filter options once, for every place that uses them:
 * the search row on top, the side panel, the chosen-filter bubbles and the sort
 * menu. The applied filters always come from the address, so there is no client
 * state to keep in sync.
 */
export function FiltersProvider({
  options,
  value,
  popular,
  categoryCounts,
  children,
}: {
  options: FilterOptions;
  value: FilterValue;
  popular: { id: number; count: number }[];
  categoryCounts: { id: number; count: number }[];
  children: ReactNode;
}) {
  const router = useRouter();
  const context = useMemo<FiltersContext>(
    () => ({
      options,
      value,
      popular,
      categoryCounts: new Map(categoryCounts.map((entry) => [entry.id, entry.count])),
      go: (next) => {
        announceNavigation();
        router.push(buildListingUrl(options, next), { scroll: false });
      },
    }),
    [options, value, popular, categoryCounts, router],
  );
  return <Context.Provider value={context}>{children}</Context.Provider>;
}

// Choosing a category loads its page, which can rebuild the picker. When the
// category has a level under it, the picker opens again so the next level can be chosen.
let keepCategoryOpen = false;

/** The category button of the top row: shows the chosen path and opens the levels. */
function CategoryPicker() {
  const { options, value, categoryCounts, go } = useFilters();
  const L = options.labels;
  const scope = filterScope(options, value);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (keepCategoryOpen) {
      keepCategoryOpen = false;
      setOpen(true);
    }
  }, [value.cat]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const pick = (categoryId?: number) => {
    const deeper = categoryId !== undefined && childCategories(options.categories, categoryId).length > 0;
    keepCategoryOpen = deeper;
    if (!deeper) setOpen(false);
    go(pruneFilters(options, { ...value, cat: categoryId }));
  };

  const label = scope.path.length ? scope.path.map((category) => category.name).join(options.locale === "en" ? " › " : " ‹ ") : L.anyType;

  return (
    <div ref={root} className="category-picker relative hidden min-w-0 lg:block">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center gap-2 rounded-xl border bg-white px-3.5 text-start transition ${open ? "border-brand-600 ring-4 ring-brand-100" : "border-line hover:border-ink"}`}
      >
        <Icon name="building" size={18} className={scope.path.length ? "shrink-0 text-brand-600" : "shrink-0 text-muted"} />
        <span className={`min-w-0 flex-1 truncate text-[15px] ${scope.path.length ? "font-semibold text-ink" : "text-muted"}`}>{label}</span>
        <Icon name="chevron" size={15} className={`shrink-0 text-muted transition ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[min(70vh,560px)] overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-pop">
          <p className="mb-3 text-[15px] font-bold text-ink">{L.category}</p>
          <CategoryLevels categories={options.categories} rootId={scope.rootId} path={scope.path} counts={categoryCounts} labels={L} onPick={pick} />
        </div>
      )}
    </div>
  );
}

/**
 * Top of the page: rent or buy, where, and what. Under it the cities as bubbles;
 * choosing one opens its areas. On small screens it also opens the full filter sheet.
 */
export function SearchRow() {
  const { options, value, popular, categoryCounts, go } = useFilters();
  const L = options.labels;
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(value);
  const [signal, setSignal] = useState(0);
  const count = panelFilterCount(value) + (value.cat ? 1 : 0);
  const draftScope = filterScope(options, draft);

  useEffect(() => setDraft(value), [value]);
  // The page behind the sheet must not scroll
  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheet]);

  const chooseCity = (cityId?: number) => {
    if (cityId === undefined) {
      if (value.cityId) go({ ...value, cityId: undefined, regionIds: undefined });
      return;
    }
    // The city's areas open next, whether or not the page has to change
    openAreasOf(cityId);
    if (cityId === value.cityId) setSignal((current) => current + 1);
    else go({ ...value, cityId, regionIds: undefined });
  };

  const bubble = (selected: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${
      selected ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-body hover:border-ink hover:text-ink"
    }`;

  return (
    <>
      <div className="sticky top-[68px] z-30 border-b border-line bg-white">
        <div className="container-page flex flex-wrap items-center gap-3 py-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex h-12 shrink-0 rounded-xl border border-line bg-surface p-1" role="group" aria-label={L.filters}>
            {options.deals.map((deal) => (
              <button
                key={deal.slug}
                type="button"
                aria-pressed={value.deal === deal.slug}
                onClick={() => value.deal !== deal.slug && go({ deal: deal.slug, cityId: value.cityId, regionIds: value.regionIds })}
                className={`rounded-lg px-4 text-sm font-bold transition sm:px-5 ${value.deal === deal.slug ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"}`}
              >
                {deal.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSheet(true)}
            className="ms-auto inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border border-line px-4 text-sm font-bold text-ink hover:border-ink lg:hidden"
          >
            <Icon name="filter" size={18} />
            {L.filters}
            {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs text-white">{count}</span>}
          </button>

          <div className="order-last flex w-full min-w-0 lg:order-none">
            <LocationSearch
              cities={options.cities}
              regions={options.regions}
              cityId={value.cityId}
              regionIds={value.regionIds}
              popular={popular}
              labels={L}
              signal={signal}
              onSelect={(cityId, regionIds) => go({ ...value, cityId, regionIds })}
            />
          </div>

          <CategoryPicker />
        </div>
      </div>

      {/* Cities as bubbles: one tap chooses the city and opens its areas */}
      <div className="border-b border-line bg-white">
        <div className="container-page no-scrollbar flex items-center gap-2 overflow-x-auto py-3">
          <button type="button" aria-pressed={!value.cityId} onClick={() => chooseCity(undefined)} className={bubble(!value.cityId)}>
            {L.allJordan}
          </button>
          {options.cities.map((city) => (
            <button key={city.id} type="button" aria-pressed={value.cityId === city.id} onClick={() => chooseCity(city.id)} className={bubble(value.cityId === city.id)}>
              {city.name}
              {value.cityId === city.id && (value.regionIds?.length ?? 0) > 0 && <span className="text-xs font-normal text-white/85">· {value.regionIds?.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setSheet(false)} />
          <div role="dialog" aria-modal="true" aria-label={L.filters} className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-3xl bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="text-lg font-bold text-ink">{L.filters}</p>
              <button type="button" onClick={() => setSheet(false)} aria-label={L.close} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <section className="border-b border-line py-4">
                <h3 className="mb-3 text-[15px] font-bold text-ink">{L.category}</h3>
                <CategoryLevels
                  categories={options.categories}
                  rootId={draftScope.rootId}
                  path={draftScope.path}
                  counts={categoryCounts}
                  labels={L}
                  onPick={(categoryId) => setDraft(pruneFilters(options, { ...draft, cat: categoryId }))}
                />
              </section>
              <FilterFields options={options} value={draft} onCommit={setDraft} mode="sheet" />
            </div>
            <div className="flex items-center gap-3 border-t border-line px-5 py-4">
              <button type="button" onClick={() => setDraft({ deal: value.deal, cityId: value.cityId, regionIds: value.regionIds, sort: value.sort })} className="btn-outline h-12 px-5">
                {L.clear}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSheet(false);
                  go(draft);
                }}
                className="btn-primary h-12 flex-1 text-[15px]"
              >
                {L.showResults}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Side panel on wide screens: every refinement applies as soon as it is chosen. It is part of the page and scrolls with it. */
export function FilterSidebar() {
  const { options, value, go } = useFilters();
  const L = options.labels;
  const refinements = panelFilterCount(value);

  return (
    <aside className="hidden lg:block" aria-label={L.filters}>
      <div className="rounded-2xl border border-line bg-white px-5 pb-2 shadow-card">
        <div className="-mx-5 flex h-[60px] items-center justify-between border-b border-line px-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Icon name="filter" size={19} />
            {L.filters}
            {refinements > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">{refinements}</span>}
          </h2>
          {refinements > 0 && (
            <button
              type="button"
              onClick={() => go({ deal: value.deal, cat: value.cat, cityId: value.cityId, regionIds: value.regionIds, sort: value.sort })}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {L.clear}
            </button>
          )}
        </div>
        <FilterFields options={options} value={value} onCommit={go} mode="instant" />
      </div>
    </aside>
  );
}

/** Everything that is applied, as bubbles in one box; each can be removed on its own. */
export function ActiveFilters() {
  const { options, value, go } = useFilters();
  const L = options.labels;
  const chips = activeChips(options, value);
  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3" aria-label={L.activeFilters}>
      <span className="me-1 text-sm font-bold text-ink">{L.activeFilters}</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => go(chip.without)}
          aria-label={`${L.remove}: ${chip.label}`}
          className="group inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-50 ps-3 pe-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          {chip.label}
          <span className="flex h-5 w-5 items-center justify-center rounded-full text-brand-600 group-hover:bg-brand-600 group-hover:text-white">
            <Icon name="close" size={12} />
          </span>
        </button>
      ))}
      <button type="button" onClick={() => go({ deal: value.deal, sort: value.sort })} className="ms-auto px-1 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
        {L.clear}
      </button>
    </div>
  );
}

export function SortSelect() {
  const { options, value, go } = useFilters();
  const L = options.labels;
  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">{L.sort}</span>
      <select
        className="h-10 appearance-none rounded-xl border border-line bg-white pe-10 ps-4 text-sm font-semibold text-ink hover:border-ink"
        value={value.sort ?? "newest"}
        onChange={(event) => go({ ...value, sort: event.target.value })}
      >
        <option value="newest">{L.sort}: {L.newest}</option>
        <option value="price_asc">{L.sort}: {L.priceAsc}</option>
        <option value="price_desc">{L.sort}: {L.priceDesc}</option>
      </select>
      <Icon name="chevron" size={14} className="pointer-events-none absolute end-3 rotate-90 text-muted" />
    </label>
  );
}
