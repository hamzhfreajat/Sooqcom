"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";

interface Section {
  title: string;
  href: string;
  links: { href: string; label: string; icon: string }[];
}

/** Site navigation on small screens, behind a menu button. */
export default function MobileMenu({ sections, extra, label }: { sections: Section[]; extra: { href: string; label: string }[]; label: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-surface lg:hidden"
      >
        <Icon name="menu" size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <nav aria-label={label} className="absolute inset-y-0 start-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white p-5 shadow-pop">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-lg font-bold text-ink">{label}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface">
                <Icon name="close" size={20} />
              </button>
            </div>
            {sections.map((section) => (
              <div key={section.href} className="border-b border-line py-4">
                <Link href={section.href} onClick={() => setOpen(false)} className="flex items-center justify-between text-base font-bold text-ink">
                  {section.title}
                  <Icon name="chevron" size={16} className="text-muted rtl:rotate-180" />
                </Link>
                <ul className="mt-3 grid grid-cols-2 gap-1">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-body hover:bg-surface">
                        <Icon name={link.icon} size={16} className="shrink-0 text-muted" />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <ul className="py-3">
              {extra.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 text-[15px] font-medium text-body hover:bg-surface">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
