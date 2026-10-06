import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import SiteShell from "@/components/SiteShell";
import { baseMetadata } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = baseMetadata("ar");
export const viewport: Viewport = { themeColor: "#1a73e8" };

export default function Layout({ children }: { children: ReactNode }) {
  return <SiteShell locale="ar">{children}</SiteShell>;
}
