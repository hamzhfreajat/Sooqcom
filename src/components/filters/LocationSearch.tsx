"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import { type FilterLabels, type PlaceOption, type RegionOption, normalizeArabic } from "./shared";

interface Props {
  cities: PlaceOption[];
  regions: RegionOption[];
  cityId?: number;
  regionIds?: number[];
  /** Ad counts for the current page: areas of the chosen city, or cities when none is chosen */
  popular: { id: number; count: number }[];
  labels: FilterLabels;
  /** Bumped by the city bubbles to open the area list of the city that is already chosen */
  signal?: number;
  onSelect: (cityId?: number, regionIds?: number[]) => void;
}

const MAX_RESULTS = 40;

// Choosing a city loads that city's page, which can rebuild this component.
// The city is remembered here so its area list opens once the page is there.
let openAreasFor: number | null = null;

/** Ask for the area list of this city to open as soon as the city is the chosen one. */
export function openAreasOf(cityId: number) {
  openAreasFor = cityId;
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((id) => b.includes(id));

/**
 * One box for the whole location. Pick a city (here or from the bubbles under the
 * box) and its areas open straight away; several areas can be ticked together.
 * Typing searches every city and area at once.
 */
export default function LocationSearch({ cities, regions, cityId, regionIds, popular, labels: L, signal = 0, onSelect }: Props) {
  const applied = useMemo(() => regionIds ?? [], [regionIds]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** The city whose areas are listed; empty shows the list of cities */
  const [viewCityId, setViewCityId] = useState<number | undefined>(cityId);
  const [picked, setPicked] = useState<number[]>(applied);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const city = cities.find((c) => c.id === cityId);
  const viewCity = cities.find((c) => c.id === viewCityId);
  const appliedRegions = applied.map((id) => regions.find((r) => r.id === id)).filter((r): r is RegionOption => !!r);
  const selectedLabel = !city
    ? ""
    : appliedRegions.length === 1
      ? `${appliedRegions[0].name}، ${city.name}`
      : appliedRegions.length > 1
        ? `${city.name} · ${appliedRegions.length} ${L.areasCount}`
        : city.name;

  // Follow the page: a new city or area set replaces whatever was being picked
  useEffect(() => {
    setViewCityId(cityId);
    setPicked(applied);
    if (cityId && openAreasFor === cityId) {
      openAreasFor = null;
      setQuery("");
      setOpen(true);
      input.current?.focus({ preventScroll: true });
    }
  }, [cityId, applied, signal]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
        setPicked(applied);
        setViewCityId(cityId);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, applied, cityId]);

  const counts = useMemo(() => new Map(popular.map((p) => [p.id, p.count])), [popular]);
  const text = normalizeArabic(query);

  const matches = (name: string) => {
    const folded = normalizeArabic(name);
    const bare = text.replace(/^ال/, "");
    const nameBare = folded.replace(/^ال/, "");
    if (folded.startsWith(text) || nameBare.startsWith(bare)) return 0;
    if (folded.includes(text) || nameBare.includes(bare)) return 1;
    return -1;
  };
  const ranked = <T extends { name: string }>(items: T[]) =>
    items
      .map((item) => ({ item, rank: matches(item.name) }))
      .filter((entry) => entry.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.item.name.length - b.item.name.length)
      .map((entry) => entry.item);

  // Areas of the city in view: busiest first, then by name
  const cityAreas = useMemo(() => {
    if (!viewCityId) return [];
    const own = regions.filter((r) => r.cityId === viewCityId);
    const showCounts = viewCityId === cityId;
    return own.sort((a, b) => (showCounts ? (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) : 0) || a.name.localeCompare(b.name));
  }, [regions, viewCityId, cityId, counts]);

  const areaRows = text ? ranked(cityAreas).slice(0, MAX_RESULTS) : cityAreas;
  const otherCities = text ? ranked(cities).filter((c) => c.id !== viewCityId) : [];
  const otherAreas = text ? ranked(regions.filter((r) => r.cityId !== viewCityId)).slice(0, MAX_RESULTS) : [];
  const cityName = (id: number) => cities.find((c) => c.id === id)?.name ?? "";
  const nothing = text !== "" && areaRows.length === 0 && otherCities.length === 0 && otherAreas.length === 0;

  const close = () => {
    setOpen(false);
    setQuery("");
    input.current?.blur();
  };

  /** A city shows its areas right away, and the results move to that city */
  const chooseCity = (id: number) => {
    setQuery("");
    setViewCityId(id);
    setPicked([]);
    if (id !== cityId || applied.length) {
      openAreasOf(id);
      onSelect(id, undefined);
    }
    input.current?.focus({ preventScroll: true });
  };

  const chooseArea = (region: RegionOption) => {
    close();
    onSelect(region.cityId, [region.id]);
  };

  const applyPicked = () => {
    close();
    if (viewCityId !== cityId || !sameSet(picked, applied)) onSelect(viewCityId, picked.length ? picked : undefined);
  };

  const clearAll = () => {
    close();
    setViewCityId(undefined);
    setPicked([]);
    if (cityId) onSelect(undefined, undefined);
  };

  const togglePicked = (id: number) => setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const dirty = viewCityId !== cityId || !sameSet(picked, applied);

  const row = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-surface";
  const groupTitle = "px-3 pb-1.5 pt-3 text-xs font-semibold text-muted";

  const placeholder = open
    ? viewCity
      ? `${L.searchArea} ${viewCity.name}`
      : L.locationPlaceholder
    : L.locationPlaceholder;

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <div className={`flex h-12 items-center gap-2 rounded-xl border bg-white px-3.5 transition ${open ? "border-brand-600 ring-4 ring-brand-100" : "border-line hover:border-ink"}`}>
        <Icon name={open ? "search" : "pin"} size={18} className={selectedLabel && !open ? "shrink-0 text-brand-600" : "shrink-0 text-muted"} />
        <input
          ref={input}
          role="combobox"
          aria-expanded={open}
          aria-controls="location-options"
          aria-autocomplete="list"
          aria-label={L.location}
          autoComplete="off"
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              close();
              setPicked(applied);
              setViewCityId(cityId);
            } else if (event.key === "Enter" && open) {
              event.preventDefault();
              // Enter takes the best match of what was typed, or applies the ticked areas
              if (text && areaRows[0]) chooseArea(areaRows[0]);
              else if (text && otherCities[0]) chooseCity(otherCities[0].id);
              else if (text && otherAreas[0]) chooseArea(otherAreas[0]);
              else if (!text) applyPicked();
            }
          }}
          className={`h-full min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-muted focus:outline-none ${selectedLabel && !open ? "font-semibold text-ink" : "text-ink"}`}
        />
        {selectedLabel && (
          <button type="button" aria-label={L.clearLocation} onClick={clearAll} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink">
            <Icon name="close" size={15} />
          </button>
        )}
      </div>

      {open && (
        <div id="location-options" className="absolute inset-x-0 top-full z-50 mt-2 flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-pop sm:min-w-[420px]">
          {viewCity && (
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <p className="truncate text-[15px] font-bold text-ink">
                {L.areasOf} {viewCity.name}
              </p>
              <button
                type="button"
                onClick={() => {
                  setViewCityId(undefined);
                  setPicked([]);
                  setQuery("");
                  input.current?.focus({ preventScroll: true });
                }}
                className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                {L.changeCity}
              </button>
            </div>
          )}

          <div role="listbox" aria-multiselectable={!!viewCity} className="min-h-0 flex-1 overflow-y-auto p-2">
            {nothing && <p className="px-3 py-6 text-center text-sm text-muted">{L.noMatch}</p>}

            {/* No city yet: the list of cities */}
            {!viewCity && !text && (
              <>
                <button type="button" role="option" aria-selected={!cityId} onClick={clearAll} className={row}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                    <Icon name="globe" size={17} />
                  </span>
                  <span className={`flex-1 text-[15px] ${!cityId ? "font-bold text-brand-700" : "font-semibold text-ink"}`}>{L.allJordan}</span>
                </button>
                {cities.map((item) => (
                  <button key={item.id} type="button" role="option" aria-selected={item.id === cityId} onClick={() => chooseCity(item.id)} className={row}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon name="building" size={17} />
                    </span>
                    <span className="flex-1 text-[15px] font-semibold text-ink">{item.name}</span>
                    {!cityId && counts.has(item.id) && <span className="text-xs text-muted">{counts.get(item.id)?.toLocaleString("en-US")}</span>}
                    <Icon name="chevron" size={15} className="text-muted rtl:rotate-180" />
                  </button>
                ))}
              </>
            )}

            {/* A city is in view: its areas, several can be ticked */}
            {viewCity && (
              <>
                {!text && (
                  <button type="button" role="option" aria-selected={picked.length === 0} onClick={() => setPicked([])} className={row}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${picked.length === 0 ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>
                      {picked.length === 0 && <Icon name="check" size={13} />}
                    </span>
                    <span className="flex-1 text-[15px] font-bold text-ink">
                      {L.allOf} {viewCity.name}
                    </span>
                  </button>
                )}
                {areaRows.map((region) => {
                  const selected = picked.includes(region.id);
                  const count = viewCityId === cityId ? counts.get(region.id) : undefined;
                  return (
                    <button key={region.id} type="button" role="option" aria-selected={selected} onClick={() => togglePicked(region.id)} className={row}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white"}`}>
                        {selected && <Icon name="check" size={13} />}
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-[15px] ${selected ? "font-bold text-brand-700" : "font-medium text-ink"}`}>{region.name}</span>
                      {count !== undefined && <span className="shrink-0 text-xs text-muted">{count.toLocaleString("en-US")}</span>}
                    </button>
                  );
                })}
              </>
            )}

            {/* Typed text also finds other cities and their areas */}
            {text && (otherCities.length > 0 || otherAreas.length > 0) && (
              <>
                {viewCity && <p className={groupTitle}>{L.otherPlaces}</p>}
                {otherCities.map((item) => (
                  <button key={`c${item.id}`} type="button" role="option" aria-selected={false} onClick={() => chooseCity(item.id)} className={row}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon name="building" size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{item.name}</span>
                      <span className="block text-xs text-muted">{L.city}</span>
                    </span>
                  </button>
                ))}
                {otherAreas.map((region) => (
                  <button key={`r${region.id}`} type="button" role="option" aria-selected={false} onClick={() => chooseArea(region)} className={row}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                      <Icon name="pin" size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{region.name}</span>
                      <span className="block truncate text-xs text-muted">{cityName(region.cityId)}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>

          {viewCity && (
            <div className="flex items-center gap-3 border-t border-line px-3 py-3">
              <span className="flex-1 truncate text-sm text-muted">
                {picked.length > 0 ? `${picked.length} ${L.areasCount} ${L.selected}` : `${L.allOf} ${viewCity.name}`}
              </span>
              <button type="button" onClick={applyPicked} disabled={!dirty} className="btn-primary h-10 px-5">
                {L.showResults}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
