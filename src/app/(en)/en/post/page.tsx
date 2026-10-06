import PostView, { postMetadata } from "@/views/PostView";

// Rendered per request so that building the site never depends on the API being up
export const dynamic = "force-dynamic";
export const metadata = postMetadata("en");

export default function Page() {
  return <PostView locale="en" />;
}
