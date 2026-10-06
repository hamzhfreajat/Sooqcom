"use client";

import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  action: string;
  deals: Option[];
  /** Type options per deal value */
  types: Record<string, Option[]>;
  cities: Option[];
  labels: { deal: string; type: string; city: string; anyType: string; allJordan: string; search: string };
}

/**
 * Builds the address of a listing page from three choices. The choices are
 * URL slugs, so the result is a normal, crawlable page rather than a search query.
 */
export default function HeroSearch({ action, deals, types, cities, labels }: Props) {
  const [deal, setDeal] = useState(deals[0].value);
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const href = [action, deal, type, city].filter(Boolean).join("/").replace(/\/{2,}/g, "/");

  const field = "h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] font-semibold text-ink";

  return (
    <form
      className="grid gap-3 rounded-2xl bg-white p-3 shadow-lift sm:grid-cols-[1fr_1fr_1fr_auto] sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        window.location.href = href;
      }}
    >
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-muted">{labels.deal}</span>
        <select
          className={field}
          value={deal}
          onChange={(e) => {
            setDeal(e.target.value);
            setType("");
          }}
        >
          {deals.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-muted">{labels.type}</span>
        <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{labels.anyType}</option>
          {(types[deal] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-muted">{labels.city}</span>
        <select className={field} value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">{labels.allJordan}</option>
          {cities.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <button type="submit" className="btn-primary h-12 self-end px-8 text-base">
        {labels.search}
      </button>
    </form>
  );
}
