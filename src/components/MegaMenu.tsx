"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export interface MenuNode {
  id: number;
  name: string;
  href: string;
  children: MenuNode[];
}

export interface Menu {
  key: string;
  label: string;
  /** "All rentals", "All properties for sale" */
  allLabel: string;
  href: string;
  /** The first level of the category tree; the rest hangs under it */
  groups: MenuNode[];
}

const GROUP_ICONS: Record<number, string> = {
  310: "building", 10310: "building", 311: "store", 10311: "store", 10313: "land", 306: "users", 314: "tree", 10314: "tree", 315: "sun", 10315: "sun", 316: "home",
};

/**
 * The header's two menus (rent, sale). Each opens a wide panel with the whole
 * category tree: the main groups in a side list, and for the chosen group every
 * category under it, down to the last level.
 */
export default function MegaMenu({ menus, viewAll }: { menus: Menu[]; viewAll: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const search = useSearchParams();

  // Any navigation closes the panel
  useEffect(() => setOpen(null), [pathname, search]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  const show = (key: string) => {
    if (closing.current) clearTimeout(closing.current);
    if (open !== key) setGroupId(null);
    setOpen(key);
  };
  // A short delay lets the pointer travel from the button to the panel
  const hide = () => {
    if (closing.current) clearTimeout(closing.current);
    closing.current = setTimeout(() => setOpen(null), 160);
  };

  const menu = menus.find((item) => item.key === open);
  const group = menu?.groups.find((item) => item.id === groupId) ?? menu?.groups[0];

  return (
    <nav className="ms-6 hidden items-center lg:flex" onMouseLeave={hide}>
      {menus.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-expanded={open === item.key}
          aria-haspopup="true"
          onMouseEnter={() => show(item.key)}
          onFocus={() => show(item.key)}
          onClick={() => (open === item.key ? setOpen(null) : show(item.key))}
          className={`flex items-center gap-1 rounded-lg px-3.5 py-2.5 text-[15px] font-semibold transition ${open === item.key ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-surface"}`}
        >
          {item.label}
          <Icon name="chevron" size={14} className={`text-muted transition ${open === item.key ? "-rotate-90" : "rotate-90"}`} />
        </button>
      ))}

      {menu && group && (
        <div className="fixed inset-x-[10px] top-[68px] z-50 pt-2" onMouseEnter={() => show(menu.key)}>
          <div className="grid max-h-[calc(100vh-96px)] grid-cols-[250px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
            {/* Main groups */}
            <div className="overflow-y-auto border-e border-line bg-surface/60 p-2.5">
              {menu.groups.map((item) => {
                const active = item.id === group.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onMouseEnter={() => setGroupId(item.id)}
                    onFocus={() => setGroupId(item.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition ${active ? "bg-white font-bold text-brand-700 shadow-card" : "font-semibold text-ink hover:bg-white"}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-brand-50 text-brand-600" : "bg-white text-muted"}`}>
                      <Icon name={GROUP_ICONS[item.id] ?? "building"} size={17} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {item.children.length > 0 && <Icon name="chevron" size={13} className="shrink-0 text-muted rtl:rotate-180" />}
                  </Link>
                );
              })}
              <Link href={menu.href} className="mt-2 flex items-center justify-center rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-bold text-brand-700 hover:border-brand-500">
                {menu.allLabel}
              </Link>
            </div>

            {/* Everything under the chosen group */}
            <div className="overflow-y-auto p-6">
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-line pb-3">
                <p className="text-lg font-bold text-ink">{group.name}</p>
                <Link href={group.href} className="shrink-0 text-sm font-bold text-brand-600 hover:text-brand-700">
                  {viewAll}
                </Link>
              </div>
              {group.children.length === 0 ? (
                <Link href={group.href} className="inline-flex h-11 items-center rounded-xl bg-brand-50 px-5 text-sm font-bold text-brand-700 hover:bg-brand-100">
                  {viewAll} {group.name}
                </Link>
              ) : group.children.every((child) => child.children.length === 0) ? (
                // Two levels only: a simple grid of links
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 xl:grid-cols-4">
                  {group.children.map((child) => (
                    <li key={child.id}>
                      <Link href={child.href} className="block rounded-lg px-3 py-2 text-[15px] font-medium text-body hover:bg-surface hover:text-brand-700">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                // Three or four levels: each category heads a column of its own sub-categories
                <div className="columns-2 gap-x-8 xl:columns-4">
                  {group.children.map((child) => (
                    <div key={child.id} className="mb-5 break-inside-avoid">
                      <Link href={child.href} className="block text-[15px] font-bold text-ink hover:text-brand-700">
                        {child.name}
                      </Link>
                      {child.children.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5 border-s-2 border-line ps-3">
                          {child.children.map((leaf) => (
                            <li key={leaf.id}>
                              <Link href={leaf.href} className="block py-1 text-sm text-body hover:text-brand-700">
                                {leaf.name}
                              </Link>
                              {/* A fourth level, where the tree has one */}
                              {leaf.children.length > 0 && (
                                <ul className="mb-1 ps-3">
                                  {leaf.children.map((last) => (
                                    <li key={last.id}>
                                      <Link href={last.href} className="block py-0.5 text-[13px] text-muted hover:text-brand-700">
                                        {last.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
