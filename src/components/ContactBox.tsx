"use client";

import { useState } from "react";

interface Labels {
  title: string;
  showNumber: string;
  whatsapp: string;
  openInApp: string;
}

/** The phone number is only displayed after a tap. */
export default function ContactBox({ phone, appUrl, labels }: { phone: string | null; appUrl: string; labels: Labels }) {
  const [revealed, setRevealed] = useState(false);
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  const whatsapp = digits.startsWith("0") ? `962${digits.slice(1)}` : digits.replace(/^\+/, "");

  return (
    <div>
      <h2 className="text-base font-extrabold text-ink">{labels.title}</h2>
      <div className="mt-4 space-y-2.5">
        {phone &&
          (revealed ? (
            <a href={`tel:${digits}`} className="btn-primary w-full py-3 text-base" dir="ltr">
              {phone}
            </a>
          ) : (
            <button type="button" onClick={() => setRevealed(true)} className="btn-primary w-full py-3 text-base">
              {labels.showNumber}
            </button>
          ))}
        {phone && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener nofollow"
            className="btn w-full bg-whatsapp py-3 text-base text-white hover:brightness-95"
          >
            {labels.whatsapp}
          </a>
        )}
        <a href={appUrl} rel="nofollow" className="btn-outline w-full py-3 text-base">
          {labels.openInApp}
        </a>
      </div>
    </div>
  );
}
