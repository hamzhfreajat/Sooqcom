"use client";

import { useEffect } from "react";
import { trackAd } from "@/lib/track";

/** Counts a view of the ad's page, once a day per visitor. Renders nothing. */
export default function AdSeen({ adId }: { adId: number }) {
  useEffect(() => {
    trackAd(adId, "seen");
  }, [adId]);
  return null;
}
