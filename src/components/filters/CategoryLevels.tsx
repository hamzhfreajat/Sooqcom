"use client";

import { type CategoryOption, type FilterLabels, childCategories } from "./shared";

interface Props {
  categories: CategoryOption[];
  /** The deal's own category: its children are the first level */
  rootId: number;
  /** Chosen categories from the first level down */
  path: CategoryOption[];
  /** Ads per category in the chosen place; categories without ads are listed too, dimmed */
  counts: Map<number, number>;
  labels: FilterLabels;
  onPick: (categoryId?: number) => void;
}

/**
 * The category tree, one row of choices per level. Choosing a category opens
 * the next level under it, as deep as the tree goes (up to four levels).
 */
export default function CategoryLevels({ categories, rootId, path, counts, labels: L, onPick }: Props) {
  const levels: { parent?: CategoryOption; parentId: number; chosen?: CategoryOption; items: CategoryOption[] }[] = [];
  let parentId = rootId;
  for (let depth = 0; depth <= path.length; depth++) {
    const chosen = path[depth];
    // Every category is listed, busiest first; the ones without ads in this place come last
    const items = childCategories(categories, parentId).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
    if (items.length === 0) break;
    levels.push({ parent: path[depth - 1], parentId, chosen, items });
    if (!chosen) break;
    parentId = chosen.id;
  }

  const chip = (selected: boolean, empty = false) =>
    `inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition ${
      selected ? "border-brand-600 bg-brand-600 text-white" : empty ? "border-line bg-surface text-muted hover:border-ink hover:text-ink" : "border-line bg-white text-ink hover:border-ink"
    }`;

  return (
    <div className="space-y-4">
      {levels.map((level, depth) => (
        <div key={level.parentId}>
          {level.parent && (
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted">
              <span className="h-px w-4 bg-line" />
              {L.typeOf} {level.parent.name}
              <span className="h-px flex-1 bg-line" />
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!level.chosen} onClick={() => onPick(depth === 0 ? undefined : level.parentId)} className={chip(!level.chosen)}>
              {L.all}
            </button>
            {level.items.map((category) => {
              const selected = level.chosen?.id === category.id;
              const empty = (counts.get(category.id) ?? 0) === 0;
              return (
                <button key={category.id} type="button" aria-pressed={selected} onClick={() => onPick(category.id)} className={chip(selected, empty)}>
                  {category.name}
                  <span className={`text-xs font-normal ${selected ? "text-white/80" : "text-muted"}`}>{(counts.get(category.id) ?? 0).toLocaleString("en-US")}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
