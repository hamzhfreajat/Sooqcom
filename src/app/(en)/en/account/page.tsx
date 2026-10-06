import type { Metadata } from "next";
import AccountView from "@/views/AccountView";

export const metadata: Metadata = { title: "My ads", robots: { index: false, follow: false } };

export default function Page() {
  return <AccountView locale="en" />;
}
