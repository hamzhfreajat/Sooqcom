import HomeView, { homeMetadata } from "@/views/HomeView";

// Rendered per request (data is cached for 5 minutes), so building the site never depends on the API being up
export const dynamic = "force-dynamic";
export const metadata = homeMetadata("en");

export default function Page() {
  return <HomeView locale="en" />;
}
