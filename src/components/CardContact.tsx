"use client";

import { useState } from "react";
import Icon from "./Icon";

interface Props {
  phone: string | null;
  /** Where the chat button leads */
  chatUrl: string;
  labels: { showNumber: string; chat: string };
  /** Small cards keep the two buttons side by side; the listing card stacks them */
  sideBySide?: boolean;
}

/**
 * The card's two contact options: the phone number, shown only after a tap,
 * and chat with the advertiser.
 */
export default function CardContact({ phone, chatUrl, labels, sideBySide = false }: Props) {
  const [revealed, setRevealed] = useState(false);
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  const hasPhone = digits.replace(/\D/g, "").length >= 9;
  const size = sideBySide ? "h-10" : "h-11 md:flex-none";
  const primary = `inline-flex ${size} min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 text-sm font-bold text-white transition hover:bg-brand-700`;

  return (
    <>
      {hasPhone &&
        (revealed ? (
          <a href={`tel:${digits}`} className={primary}>
            <Icon name="phone" size={17} className="shrink-0" />
            <span dir="ltr" className="truncate tracking-wide">{phone}</span>
          </a>
        ) : (
          <button type="button" onClick={() => setRevealed(true)} className={primary}>
            <Icon name="phone" size={17} className="shrink-0" />
            <span className="truncate">{labels.showNumber}</span>
          </button>
        ))}
      <a
        href={chatUrl}
        rel="nofollow"
        className={`inline-flex ${size} min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-3 text-sm font-bold text-brand-700 transition hover:border-brand-600 hover:bg-brand-50`}
      >
        <Icon name="chat" size={18} className="shrink-0" />
        <span className="truncate">{labels.chat}</span>
      </a>
    </>
  );
}
